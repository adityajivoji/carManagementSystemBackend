const AWS = require('aws-sdk');

// Configure the AWS SDK with your S3 credentials
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your AWS access key
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS secret key
  region: process.env.AWS_REGION // Your AWS region (e.g., 'us-west-2')
});

const s3 = new AWS.S3();

module.exports = s3;
