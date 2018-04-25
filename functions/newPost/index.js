const AWS = require('aws-sdk');
const uuid = require('uuid');

exports.handler = async (event, context) => {
  const id = uuid.v4();
  const body = JSON.parse(event.body);
  const { voice, text } = body;

  console.log(`Generating new DynamoDB record with ID ${id}`);
  console.log(`Input text: ${text}`);
  console.log(`Selected Voice: ${voice}`);

  const dynamodb = new AWS.DynamoDB({ endpoint: process.env.DYNAMODB_ENDPOINT });

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id: {
        S: id
      },
      text: {
        S: text
      },
      voice: {
        S: voice
      },
      status: {
        S: 'PROCESSING'
      }
    }
  };

  try {
    await dynamodb.putItem(params).promise();
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Could not insert to database'
      })
    };
  }

  const sns = new AWS.SNS();

  const microtime = (new Date()).getTime();
  console.log(`Publishing message ${id} to Topic ${process.env.SNS_TOPIC}...`)
  await sns.publish({
    Message: id,
    TopicArn: process.env.SNS_TOPIC
  }).promise();

  console.log(`Published ${id} to ${process.env.SNS_TOPIC} within ${((new Date()).getTime() - microtime)} milliseconds.`);

  return {
    statusCode: 201,
    body: id,
    headers: {
      'Content-Type': 'text/plain'
    }
  };
};
