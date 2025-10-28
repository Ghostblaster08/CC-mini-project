import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Create S3 instance
export const s3 = new AWS.S3();

// S3 Bucket name
export const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Upload file to S3
export const uploadToS3 = async (file, folder = 'prescriptions') => {
  const key = `${folder}/${Date.now()}-${file.originalname}`;
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: 'private' // Remove ACL to avoid permission issues
  };

  try {
    console.log('📤 Uploading to S3:', key);
    console.log('   Bucket:', BUCKET_NAME);
    console.log('   ContentType:', file.mimetype);
    
    // Use putObject instead of upload for simpler operation
    await s3.putObject(params).promise();
    
    const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
    
    console.log('✅ S3 upload successful!');
    console.log('   URL:', fileUrl);
    
    return {
      url: fileUrl,
      key: key,
      bucket: BUCKET_NAME
    };
  } catch (error) {
    console.error('❌ S3 Upload Error:', error.message);
    console.error('   Error Code:', error.code);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

// Get signed URL for private S3 objects
export const getSignedUrl = (key, expiresIn = 3600) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn
  };

  return s3.getSignedUrl('getObject', params);
};

// Delete file from S3
export const deleteFromS3 = async (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

export default { s3, uploadToS3, getSignedUrl, deleteFromS3 };
