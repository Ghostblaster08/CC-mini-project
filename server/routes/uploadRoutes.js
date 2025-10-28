import express from 'express';
import AWS from 'aws-sdk';

const router = express.Router();

// Configure S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4'
});

// GET /api/upload-url?file=<filename>&type=<mimetype>
// Returns a pre-signed URL for direct client-to-S3 upload
router.get('/upload-url', async (req, res) => {
  try {
    const { file, type } = req.query;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Filename is required' 
      });
    }

    // Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const fileExtension = file.substring(file.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file type. Allowed: JPG, PNG, PDF' 
      });
    }

    // Use provided content type or detect from extension
    const contentType = type || getContentType(fileExtension);

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `prescriptions/${timestamp}-${sanitizedFilename}`;

    // Generate pre-signed URL for PUT operation
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Expires: 300, // URL expires in 5 minutes
      ContentType: contentType, // CRITICAL: Must match frontend upload header
      // ACL: 'public-read' // Uncomment if bucket allows public read
    };

    console.log('🔑 Generating pre-signed URL:');
    console.log('   Key:', key);
    console.log('   Content-Type:', contentType);
    console.log('   Bucket:', process.env.AWS_S3_BUCKET);

    const url = await s3.getSignedUrlPromise('putObject', params);

    console.log('✅ Pre-signed URL generated successfully');

    res.json({ 
      success: true,
      url,
      key,
      contentType, // Send back to frontend so it uses exact same type
      expiresIn: 300
    });

  } catch (error) {
    console.error('❌ Error generating pre-signed URL:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Helper function to determine content type
function getContentType(extension) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf'
  };
  return types[extension] || 'application/octet-stream';
}

export default router;
