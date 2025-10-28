import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000'
      ],
      ExposeHeaders: [
        'ETag',
        'x-amz-server-side-encryption',
        'x-amz-request-id',
        'x-amz-id-2'
      ],
      MaxAgeSeconds: 3000
    }
  ]
};

async function setupCORS() {
  console.log('\n🌐 Setting up CORS for S3 bucket...\n');
  
  const bucketName = process.env.AWS_S3_BUCKET;
  
  if (!bucketName) {
    console.error('❌ AWS_S3_BUCKET not found in .env');
    process.exit(1);
  }
  
  console.log(`Bucket: ${bucketName}`);
  console.log('CORS Configuration:');
  console.log(JSON.stringify(corsConfiguration, null, 2));
  console.log('\n');
  
  try {
    // Apply CORS configuration
    await s3.putBucketCors({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration
    }).promise();
    
    console.log('✅ CORS configuration applied successfully!\n');
    
    // Verify by reading back
    const result = await s3.getBucketCors({
      Bucket: bucketName
    }).promise();
    
    console.log('📋 Current CORS configuration:');
    console.log(JSON.stringify(result.CORSRules, null, 2));
    console.log('\n');
    console.log('🎉 All done! Your bucket now accepts uploads from localhost.\n');
    
  } catch (error) {
    if (error.code === 'AccessDenied') {
      console.error('❌ ACCESS DENIED\n');
      console.error('AWS Learner Lab does not allow s3:PutBucketCORS operation.');
      console.error('\nYou need to configure CORS manually in AWS Console:');
      console.error('1. Go to: https://s3.console.aws.amazon.com/s3/buckets');
      console.error('2. Click on bucket: ' + bucketName);
      console.error('3. Go to Permissions tab');
      console.error('4. Scroll to "Cross-origin resource sharing (CORS)"');
      console.error('5. Click Edit and paste the configuration shown above');
      console.error('\nAlternatively, use traditional upload (uncheck "Direct S3" in UI).\n');
    } else {
      console.error('❌ Error:', error.message);
      console.error('\nFull error:', error);
    }
    process.exit(1);
  }
}

setupCORS();
