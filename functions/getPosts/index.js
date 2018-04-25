const AWS = require('aws-sdk');

exports.handler = async (event, context) => {
  const dynamodb = new AWS.DynamoDB({ endpoint: process.env.DYNAMODB_ENDPOINT });

  if (event.pathParameters) {
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": {
          S: event.pathParameters.id
        }
      }
    };

    const result = await dynamodb.query(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result["Items"]),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  const result = await dynamodb.scan({ TableName: process.env.DYNAMODB_TABLE }).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(result["Items"]),
    headers: {
      'Content-Type': 'application/json'
    }
  }
};
