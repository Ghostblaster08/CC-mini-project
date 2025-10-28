# 🌐 S3 CORS Configuration Guide

## Problem
```
Access to XMLHttpRequest at 'https://ghostblaster911.s3.amazonaws.com/...' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

## Solution: Add CORS Configuration to S3 Bucket

### **Option 1: AWS Console (Easiest)**

1. **Go to AWS S3 Console**
   - Navigate to: https://s3.console.aws.amazon.com/s3/buckets
   - Find your bucket: `ghostblaster911`

2. **Open Permissions Tab**
   - Click on the bucket name
   - Go to **Permissions** tab
   - Scroll down to **Cross-origin resource sharing (CORS)**

3. **Add CORS Configuration**
   - Click **Edit**
   - Paste this JSON:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

4. **Save Changes**

---

### **Option 2: AWS CLI**

Save this to a file `cors-config.json`:
```json
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
            "AllowedOrigins": [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000"
            ],
            "ExposeHeaders": [
                "ETag",
                "x-amz-server-side-encryption",
                "x-amz-request-id",
                "x-amz-id-2"
            ],
            "MaxAgeSeconds": 3000
        }
    ]
}
```

Then run:
```bash
aws s3api put-bucket-cors \
  --bucket ghostblaster911 \
  --cors-configuration file://cors-config.json \
  --profile default
```

---

### **Option 3: Using Node.js Script**

I've created a script for you:

```bash
cd /home/ghostblaster/Projects/CC-mini-project/server
node scripts/setup-s3-cors.js
```

---

## ⚠️ **AWS Learner Lab Warning**

AWS Learner Lab might **also block** the ability to modify bucket CORS settings with:
```
AccessDenied: User is not authorized to perform: s3:PutBucketCORS
```

If this happens, you have two options:

### **Fallback 1: Keep Traditional Upload**
Uncheck "Use Direct S3 Upload" in the UI and use server-side upload instead.

### **Fallback 2: Use Proxy Approach**
Create a backend endpoint that proxies the upload to S3 (avoiding browser CORS).

---

## 🧪 **Test After Configuration**

1. Go to upload page
2. Enable "Use Direct S3 Upload (Pre-signed URL)"
3. Upload a file
4. Check console - should see `✅ Upload to S3 successful!`

---

## 📋 **What Each Part Means**

- **AllowedHeaders**: `["*"]` - Allow all headers from browser
- **AllowedMethods**: `["PUT", "GET", ...]` - HTTP methods browser can use
- **AllowedOrigins**: Your frontend URLs (localhost for development)
- **ExposeHeaders**: Headers browser can read from S3 response
- **MaxAgeSeconds**: How long browser caches CORS preflight (3000 = 50 min)

---

## 🎯 **For Production**

When deploying to production, update `AllowedOrigins`:
```json
"AllowedOrigins": [
    "https://yourapp.com",
    "https://www.yourapp.com"
]
```

**Never use `"*"` in production** - it's a security risk!
