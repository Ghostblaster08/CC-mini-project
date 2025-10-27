/**
 * S3 Bucket Setup Script using AWS SDK
 * Creates and configures the Ashray Pharmacy prescription bucket
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import AWS from 'aws-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN, // If using temporary credentials
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'ashray-prescriptions';
const REGION = process.env.AWS_REGION || 'us-east-1';

async function setupS3Bucket() {
  console.log('🚀 Setting up AWS S3 Bucket for Ashray Pharmacy...\n');
  
  try {
    // Step 1: Check if bucket exists
    console.log('📋 Step 1: Checking if bucket exists...');
    try {
      await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
      console.log(`✅ Bucket '${BUCKET_NAME}' already exists!\n`);
    } catch (err) {
      if (err.code === 'NotFound' || err.code === 'NoSuchBucket') {
        // Step 2: Create bucket
        console.log(`📦 Step 2: Creating bucket '${BUCKET_NAME}'...`);
        
        const createParams = {
          Bucket: BUCKET_NAME,
          ACL: 'private'
        };
        
        // Only add LocationConstraint if not us-east-1
        if (REGION !== 'us-east-1') {
          createParams.CreateBucketConfiguration = {
            LocationConstraint: REGION
          };
        }
        
        await s3.createBucket(createParams).promise();
        console.log(`✅ Bucket created successfully!\n`);
      } else {
        throw err;
      }
    }

    // Step 3: Enable versioning
    console.log('🔄 Step 3: Enabling versioning...');
    await s3.putBucketVersioning({
      Bucket: BUCKET_NAME,
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    }).promise();
    console.log('✅ Versioning enabled!\n');

    // Step 4: Block public access
    console.log('🔒 Step 4: Blocking public access...');
    await s3.putPublicAccessBlock({
      Bucket: BUCKET_NAME,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true
      }
    }).promise();
    console.log('✅ Public access blocked!\n');

    // Step 5: Enable encryption
    console.log('🔐 Step 5: Enabling server-side encryption...');
    await s3.putBucketEncryption({
      Bucket: BUCKET_NAME,
      ServerSideEncryptionConfiguration: {
        Rules: [{
          ApplyServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256'
          }
        }]
      }
    }).promise();
    console.log('✅ Encryption enabled (AES256)!\n');

    // Step 6: Configure CORS
    console.log('🌐 Step 6: Configuring CORS...');
    await s3.putBucketCors({
      Bucket: BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: [
              'http://localhost:3000',
              'http://localhost:5173',
              'http://localhost:5174',
              process.env.CLIENT_URL || '*'
            ].filter(Boolean),
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000
          }
        ]
      }
    }).promise();
    console.log('✅ CORS configured!\n');

    // Step 7: Set lifecycle policy
    console.log('♻️  Step 7: Setting lifecycle policy...');
    await s3.putBucketLifecycleConfiguration({
      Bucket: BUCKET_NAME,
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'TransitionToIA',
            Status: 'Enabled',
            Prefix: '',
            Transitions: [
              {
                Days: 90,
                StorageClass: 'STANDARD_IA'
              },
              {
                Days: 180,
                StorageClass: 'GLACIER'
              }
            ]
          },
          {
            Id: 'DeleteOldVersions',
            Status: 'Enabled',
            Prefix: '',
            NoncurrentVersionExpiration: {
              NoncurrentDays: 30
            }
          }
        ]
      }
    }).promise();
    console.log('✅ Lifecycle policy set!\n');

    // Step 8: Verify setup
    console.log('🔍 Step 8: Verifying bucket configuration...');
    const [versioningStatus, encryptionStatus, corsStatus] = await Promise.all([
      s3.getBucketVersioning({ Bucket: BUCKET_NAME }).promise(),
      s3.getBucketEncryption({ Bucket: BUCKET_NAME }).promise(),
      s3.getBucketCors({ Bucket: BUCKET_NAME }).promise()
    ]);

    console.log('📊 Bucket Configuration Summary:');
    console.log(`   - Bucket Name: ${BUCKET_NAME}`);
    console.log(`   - Region: ${REGION}`);
    console.log(`   - Versioning: ${versioningStatus.Status}`);
    console.log(`   - Encryption: ${encryptionStatus.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm}`);
    console.log(`   - CORS Rules: ${corsStatus.CORSRules.length} configured`);
    console.log(`   - Public Access: Blocked`);
    console.log(`   - Lifecycle Policies: Active\n`);

    console.log('✨ S3 bucket setup completed successfully!\n');
    console.log('🔗 Access your bucket at:');
    console.log(`   https://s3.console.aws.amazon.com/s3/buckets/${BUCKET_NAME}\n`);

  } catch (error) {
    console.error('❌ Error setting up S3 bucket:', error.message);
    
    if (error.code === 'InvalidAccessKeyId' || error.code === 'SignatureDoesNotMatch') {
      console.error('\n⚠️  AWS credentials are invalid or expired.');
      console.error('   Please update your credentials in server/.env file.\n');
    } else if (error.code === 'BucketAlreadyExists') {
      console.error('\n⚠️  Bucket name is already taken globally.');
      console.error('   Please use a different bucket name in .env file.\n');
    } else if (error.code === 'BucketAlreadyOwnedByYou') {
      console.error('\n⚠️  Bucket already exists in your account.');
      console.error('   Continuing with configuration...\n');
    }
    
    process.exit(1);
  }
}

// Run the setup
setupS3Bucket().catch(console.error);
