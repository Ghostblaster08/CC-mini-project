/**
 * List existing S3 buckets
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import AWS from 'aws-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

async function listBuckets() {
  try {
    console.log('🔍 Listing available S3 buckets...\n');
    
    const data = await s3.listBuckets().promise();
    
    if (data.Buckets.length === 0) {
      console.log('⚠️  No S3 buckets found in your AWS account.');
      console.log('\n💡 For AWS Academy Learner Lab:');
      console.log('   You may need to use the provided S3 bucket.');
      console.log('   Check your lab resources for existing buckets.\n');
      return;
    }
    
    console.log(`📦 Found ${data.Buckets.length} bucket(s):\n`);
    
    for (const bucket of data.Buckets) {
      console.log(`   - ${bucket.Name}`);
      console.log(`     Created: ${bucket.CreationDate}\n`);
    }
    
    console.log('\n💡 Update your .env file with one of these bucket names:');
    console.log('   AWS_S3_BUCKET=<bucket-name>\n');
    
  } catch (error) {
    console.error('❌ Error listing buckets:', error.message);
    
    if (error.code === 'ExpiredToken') {
      console.error('\n⚠️  Your AWS session has expired.');
      console.error('   Please refresh your AWS Learner Lab credentials.\n');
    }
  }
}

listBuckets();
