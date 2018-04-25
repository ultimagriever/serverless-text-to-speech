# Serverless Text-to-Speech with AWS SAM

This implementation of the [Serverless Text-to-Speech](http://serverlessttswebsite.s3-website-us-east-1.amazonaws.com/)
app uses the [AWS Serverless Application Model](https://github.com/awslabs/serverless-application-model)
to deploy and provision the resources necessary to run.

### Running locally

```bash
# To run the API Gateway-based functions
sam local start-api --parameter-values 'ParameterKey=DynamoDBEndpoint,ParameterValue=<your DynamoDB Local endpoint>'

# To run the ConvertToAudio function manually
sam local generate-event sns --message "<record-id>" | sam local invoke ConvertToAudio --parameter-values 'ParameterKey=DynamoDBEndpoint,ParameterValue=<your DynamoDB Local endpoint>'
```

### Deploying

```bash
aws cloudformation package --template-file template.yaml --s3-bucket <your S3 deploy bucket> --output-template-file packaged-template.yaml
aws cloudformation deploy --template-file packaged-template.yaml --stack-name ServerlessTTSStack --capabilities CAPABILITY_IAM
```

Check the [step-by-step](https://github.com/ultimagriever/serverless-text-to-speech/wiki) here.