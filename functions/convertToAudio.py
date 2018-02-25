import boto3
import os
from contextlib import closing
from boto3.dynamodb.conditions import Key, Attr


def lambda_handler(event, context):

    postId = event["Records"][0]["Sns"]["Message"]

    print("Text to Speech function. Post ID in DynamoDB: " + postId)

    # Get post information from DynamoDB
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(os.environ["DB_TABLE_NAME"])
    postItem = table.query(
        KeyConditionExpression=Key('id').eq(postId)
    )

    text = postItem["Items"][0]["text"]
    voice = postItem["Items"][0]["voice"]

    # Truncate text to pass to Polly synthesize_speech,
    # since it can only transform text with about 1500 characters.
    # We are going to divide the text into approximately 1000-character blocks
    # and then merge the audio files together.
    rest = text
    textBlocks = []
    while len(rest) > 1100:
        begin = 0
        end = rest.find(".", 1000)

        if end == -1:
            end = rest.find(" ", 1000)

        textBlock = rest[begin:end]
        rest = rest[end:]
        textBlocks.append(textBlock)
    textBlocks.append(rest)

    # For each block, invoke the Polly API to convert text to audio
    polly = boto3.client('polly')
    for textBlock in textBlocks:
        response = polly.synthesize_speech(
            OutputFormat='mp3',
            Text=textBlock,
            VoiceId=voice
        )

        # Save the audio stream to Lambda's temp directory. If there is more than one
        # text block, the audio stream will be merged into one file.
        if "AudioStream" in response:
            with closing(response["AudioStream"]) as stream:
                output = os.path.join("/tmp/", postId)
                with open(output, "ab") as file:
                    file.write(stream.read())


    # Save the audio file to S3
    s3 = boto3.client('s3')
    s3.upload_file("/tmp/" + postId, os.environ["BUCKET_NAME"], postId + ".mp3")
    s3.put_object_acl(
        Bucket=os.environ["BUCKET_NAME"],
        ACL="public-read",
        Key=postId + ".mp3"
    )

    location = s3.get_bucket_location(Bucket=os.environ["BUCKET_NAME"])
    region = location["LocationConstraint"]

    if region is None:
        url_beginning = "https://s3.amazonaws.com/"
    else:
        url_beginning = "https://s3-" + str(region) + ".amazonaws.com/"

    url = url_beginning \
        + str(os.environ["BUCKET_NAME"]) \
        + "/" \
        + str(postId) + ".mp3"

    # Update the item in DynamoDB
    response = table.update_item(
        Key={'id': postId},
        UpdateExpression="SET #statusAtt = :statusValue, #urlAtt = :urlValue",
        ExpressionAttributeValues={
            ":statusValue": "UPDATED",
            ":urlValue": url
        },
        ExpressionAttributeNames={
            "#statusAtt": "status",
            "#urlAtt": "url"
        }
    )

    return
