const AWS = require('aws-sdk');
const fs = require('fs');

exports.handler = async (event, context) => {
  const id = event.Records[0].Sns.Message;

  console.log(`Text-to-speech function. Post ID in DynamoDB: ${id}`);

  const dynamodb = new AWS.DynamoDB({ endpoint: process.env.DYNAMODB_ENDPOINT });
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": {
        S: id
      }
    }
  };

  const result = await dynamodb.query(params).promise();

  const { text, voice } = result.Items[0];

  // Truncate text to pass to Polly synthesize_speech,
  // since it can only transform text with about 1500 characters.
  // We are going to divide the text into approximately 1000-character blocks
  // and then merge the audio files together.
  let rest = text.S;
  const textBlocks = [];
  while (rest.length > 1100) {
    let begin = 0;
    let end = rest.substring(0, 1000).indexOf(".");

    if (end < 0) {
      end = rest.substring(0, 1000).indexOf(" ");
    }

    const textBlock = rest.substring(begin, end + 1);
    rest = rest.substring(end + 1).trim();
    textBlocks.push(textBlock);
  }

  textBlocks.push(rest);

  // For each block, invoke Polly API to convert text to audio
  const polly = new AWS.Polly();

  const promises = textBlocks.map(textBlock =>
    polly.synthesizeSpeech({
      OutputFormat: "mp3",
      Text: textBlock,
      VoiceId: voice.S
    }).promise());

  const responses = await Promise.all(promises);

  const streams = responses.map(a => a.AudioStream);

  const buffer = Buffer.concat(streams, streams.reduce((len, a) => len + a.length, 0));

  const s3 = new AWS.S3();

  const bucketParams = {
    Body: buffer,
    Bucket: process.env.BUCKET_NAME,
    Key: `${id}.mp3`,
    ACL: 'public-read',
    ContentType: 'audio/mpeg'
  };

  await s3.putObject(bucketParams).promise();

  const location = await s3.getBucketLocation({ Bucket: process.env.BUCKET_NAME }).promise();
  const region = location.LocationConstraint;

  const audioUrlBeginning = region ? `https://s3-${region}.amazonaws.com` : `https://s3.amazonaws.com`;

  const audioUrl = `${audioUrlBeginning}/${process.env.BUCKET_NAME}/${id}.mp3`;

  await dynamodb.updateItem({
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: {
        S: id
      }
    },
    UpdateExpression: "SET #statusAtt = :statusValue, #urlAtt = :urlValue",
    ExpressionAttributeValues: {
      ':statusValue': {
        S: 'UPDATED'
      },
      ':urlValue': {
        S: audioUrl
      }
    },
    ExpressionAttributeNames: {
      '#statusAtt': 'status',
      '#urlAtt': 'url'
    }
  }).promise();

  return {
    statusCode: 200,
    body: "",
    headers: {
      'Content-Type': 'text/plain'
    }
  };
};
