import { useState } from "react";

export default function useS3Upload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const upload = async (file) => {
    try {
      setError(null);
      setProgress(0);
      setUploading(true);

      const fileName = `${Date.now()}-${file.name}`;
      const fileType = file.type; // Get actual MIME type from file

      console.log('📤 Step 1: Requesting pre-signed URL');
      console.log('   File name:', fileName);
      console.log('   File type:', fileType);
      console.log('   File size:', file.size, 'bytes');

      // Step 1: Get pre-signed URL from backend with exact content type
      const res = await fetch(
        `http://localhost:5000/api/upload-url?file=${encodeURIComponent(fileName)}&type=${encodeURIComponent(fileType)}`
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { url, key, contentType } = await res.json();
      console.log('✅ Pre-signed URL received');
      console.log('   S3 Key:', key);
      console.log('   Content-Type:', contentType);

      // Step 2: Upload directly to S3 using XMLHttpRequest to track progress
      console.log('📤 Step 2: Uploading to S3...');
      console.log('   Using Content-Type:', contentType);

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setProgress(percentComplete);
            console.log(`📊 Upload progress: ${percentComplete}%`);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            console.log('✅ Upload to S3 successful!');
            resolve();
          } else {
            console.error('❌ S3 upload failed:', xhr.status, xhr.statusText);
            console.error('Response:', xhr.responseText);
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          console.error('❌ Network error during upload');
          reject(new Error('Network error during upload'));
        };

        // CRITICAL: Must use exact same Content-Type as pre-signed URL
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.send(file);
      });

      setUploading(false);
      setProgress(100);

      // Return the S3 URL (without query parameters)
      const s3Url = url.split("?")[0];
      console.log('🎉 Upload complete! File URL:', s3Url);

      return {
        url: s3Url,
        key: key
      };
      
    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Upload failed');
      setUploading(false);
      return null;
    }
  };

  return { upload, uploading, progress, error };
}
