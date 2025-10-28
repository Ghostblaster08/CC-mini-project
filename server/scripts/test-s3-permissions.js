import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const bucketName = process.env.AWS_S3_BUCKET;

console.log(`🪣 Testing permissions for bucket: ${bucketName}\n`);

async function testPermissions() {
  const tests = [
    {
      name: 'ListObjects (Read)',
      test: () => s3.listObjectsV2({ Bucket: bucketName, MaxKeys: 5 }).promise()
    },
    {
      name: 'GetBucketLocation',
      test: () => s3.getBucketLocation({ Bucket: bucketName }).promise()
    },
    {
      name: 'GetBucketPolicy',
      test: () => s3.getBucketPolicy({ Bucket: bucketName }).promise()
    },
    {
      name: 'GetBucketAcl',
      test: () => s3.getBucketAcl({ Bucket: bucketName }).promise()
    },
    {
      name: 'PutObject (Upload Test)',
      test: () => s3.putObject({
        Bucket: bucketName,
        Key: 'test-upload.txt',
        Body: 'Testing upload permissions',
        ContentType: 'text/plain'
      }).promise()
    },
    {
      name: 'PutBucketPolicy (Modify Policy)',
      test: () => s3.putBucketPolicy({
        Bucket: bucketName,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${bucketName}/*`
          }]
        })
      }).promise()
    }
  ];

  for (const { name, test } of tests) {
    try {
      const result = await test();
      console.log(`✅ ${name} - ALLOWED`);
      if (name === 'ListObjects (Read)' && result.Contents) {
        console.log(`   Found ${result.Contents.length} objects`);
      }
      if (name === 'GetBucketPolicy' && result.Policy) {
        console.log(`   Current policy exists`);
      }
    } catch (error) {
      console.log(`❌ ${name} - DENIED (${error.code})`);
      if (error.message) {
        console.log(`   ${error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY:');
  console.log('If PutObject is DENIED, you cannot upload to S3.');
  console.log('If PutBucketPolicy is DENIED, you cannot change permissions.');
  console.log('='.repeat(50));
}

testPermissions();
