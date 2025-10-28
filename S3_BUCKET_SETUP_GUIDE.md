# 🪣 AWS S3 Bucket Setup Guide for Prescription Uploads

## ⚠️ **AWS Learner Lab Limitation**

Your test showed **all AWS services are blocked** with `AccessDenied` errors. This means:
- ❌ You likely **cannot create new S3 buckets**
- ❌ You likely **cannot modify bucket policies**
- ❌ AWS Learner Lab has **explicit deny policies** blocking write operations

**However**, let me show you what **SHOULD** be done in a real AWS account:

---

## 📋 **Step-by-Step: Create S3 Bucket (Real AWS Account)**

### **Step 1: Create the Bucket**

1. **Go to AWS Console**
   - Navigate to: https://console.aws.amazon.com/s3/
   - Click **"Create bucket"**

2. **Bucket Settings:**
   ```
   Bucket name: ashray-pharmacy-prescriptions
   AWS Region: us-east-1 (must match your .env AWS_REGION)
   ```

3. **Object Ownership:**
   - Select: **"ACLs disabled (recommended)"**
   - Bucket owner enforces ownership

4. **Block Public Access Settings:**
   ```
   ✅ Block all public access (CHECKED)
   ```
   *(You don't want prescription files publicly accessible)*

5. **Bucket Versioning:**
   - Select: **"Disable"** (or Enable for backup protection)

6. **Encryption:**
   - Select: **"Server-side encryption with Amazon S3 managed keys (SSE-S3)"**
   - ✅ Bucket Key: Enabled

7. **Click "Create bucket"**

---

### **Step 2: Configure Bucket Policy (Allow Uploads)**

1. **Go to bucket** → **Permissions** tab

2. **Scroll to "Bucket policy"** → Click **"Edit"**

3. **Add this policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowUserUploads",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_USERNAME"
      },
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::ashray-pharmacy-prescriptions/*"
    }
  ]
}
```

**Replace:**
- `YOUR_ACCOUNT_ID`: Your AWS account number (found in top right of console)
- `YOUR_USERNAME`: Your IAM username

4. **Click "Save changes"**

---

### **Step 3: Configure CORS (For Web Uploads)**

If you want to upload directly from browser (future feature):

1. **Go to bucket** → **Permissions** tab

2. **Scroll to "Cross-origin resource sharing (CORS)"** → Click **"Edit"**

3. **Add this CORS configuration:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:5174",
      "http://ec2-3-89-123-45.compute-1.amazonaws.com:5173"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

4. **Click "Save changes"**

---

### **Step 4: Update Your Code**

Update `.env` file:

```bash
AWS_S3_BUCKET=ashray-pharmacy-prescriptions
AWS_REGION=us-east-1
```

**No code changes needed!** Your existing code in `server/config/aws.js` will work automatically.

---

## 🔧 **Alternative: Try in AWS Learner Lab (Might Fail)**

### **Method 1: Using AWS CLI (Terminal)**

```bash
# Navigate to server directory
cd /home/ghostblaster/Projects/CC-mini-project/server

# Try to create bucket
aws s3 mb s3://ashray-pharmacy-prescriptions-$(date +%s) --region us-east-1

# If successful, set bucket policy
aws s3api put-bucket-policy \
  --bucket ashray-pharmacy-prescriptions-TIMESTAMP \
  --policy file://bucket-policy.json
```

**Expected Result:** ❌ `AccessDenied` or `UnauthorizedOperation`

---

### **Method 2: Using Node.js Script**

Create `server/scripts/create-s3-bucket.js`:

```javascript
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

async function createBucket() {
  const bucketName = `ashray-pharmacy-${Date.now()}`;
  
  try {
    console.log('🪣 Creating S3 bucket:', bucketName);
    
    // Create bucket
    await s3.createBucket({
      Bucket: bucketName,
      CreateBucketConfiguration: {
        LocationConstraint: process.env.AWS_REGION
      }
    }).promise();
    
    console.log('✅ Bucket created:', bucketName);
    
    // Set bucket policy
    const policy = {
      Version: '2012-10-17',
      Statement: [{
        Sid: 'AllowUploads',
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:PutObject', 's3:GetObject'],
        Resource: `arn:aws:s3:::${bucketName}/*`
      }]
    };
    
    await s3.putBucketPolicy({
      Bucket: bucketName,
      Policy: JSON.stringify(policy)
    }).promise();
    
    console.log('✅ Bucket policy set');
    console.log('\n📝 Update your .env file:');
    console.log(`AWS_S3_BUCKET=${bucketName}`);
    
  } catch (error) {
    console.error('❌ Error:', error.code, error.message);
  }
}

createBucket();
```

**Run it:**
```bash
node scripts/create-s3-bucket.js
```

**Expected Result:** ❌ `AccessDenied` (Learner Lab blocks bucket creation)

---

## 🎯 **What About Your Existing Bucket "ghostblaster911"?**

You mentioned you already have `ghostblaster911` bucket. Let's check if you can modify its policy:

### **Check Bucket Details:**

```bash
# List bucket (this worked before)
aws s3 ls s3://ghostblaster911/

# Try to get bucket policy
aws s3api get-bucket-policy --bucket ghostblaster911

# Try to put bucket policy
aws s3api put-bucket-policy \
  --bucket ghostblaster911 \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"AWS": "'$(aws sts get-caller-identity --query Arn --output text)'"},
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::ghostblaster911/*"
    }]
  }'
```

---

## 📊 **Reality Check: AWS Learner Lab**

Based on your test results showing **ALL services denied**:

```
❌ S3: ListBuckets - Denied
❌ DynamoDB: Denied
❌ EC2: Denied
❌ CloudWatch: Denied
❌ SNS: Denied
❌ SQS: Denied
```

**AWS Learner Lab likely has:**
1. ✅ Read-only permissions (view existing resources)
2. ❌ No write permissions (create/modify resources)
3. ❌ Explicit deny policies that **cannot be overridden**

---

## 💡 **Your Best Options**

### **Option 1: Use Existing Bucket (If You Created It Before)**

If `ghostblaster911` was created **before** Learner Lab restrictions:

1. Check if you're the owner
2. Try adding bucket policy via AWS Console (not CLI)
3. AWS Console might have different permissions than SDK

**Steps:**
1. Go to: https://s3.console.aws.amazon.com/s3/buckets/ghostblaster911
2. Click **Permissions** tab
3. Scroll to **Bucket policy** → **Edit**
4. Try adding the policy from Step 2 above
5. Click **Save**

**Expected:** Might work if bucket was yours, or ❌ AccessDenied

---

### **Option 2: Ask Your Professor for AWS Account**

**Email template:**

> Subject: AWS Learner Lab Restrictions - Cloud Pharmacy Project
> 
> Hi Professor,
> 
> For our Group 3 Cloud Pharmacy project, we've integrated:
> - MongoDB Atlas (cloud database - working ✅)
> - AWS S3 SDK (code complete - blocked by Learner Lab ❌)
> 
> AWS Learner Lab applies explicit deny policies blocking all write operations (CreateBucket, PutObject, PutBucketPolicy). Our code is production-ready but cannot be tested.
> 
> Could we either:
> 1. Get temporary access to a less-restricted AWS account, or
> 2. Demonstrate cloud architecture without active uploads?
> 
> Our hybrid architecture (cloud + local fallback) is working, but we cannot show actual S3 uploads due to permissions.
> 
> Thank you!

---

### **Option 3: Use Alternative Cloud Storage**

If AWS is completely blocked, consider:

**Cloudinary (Free Tier - 25GB):**
- Medical image hosting
- Easy Node.js SDK
- Free tier available

**Google Cloud Storage:**
- Similar to S3
- Might have less restrictions in educational account

**Azure Blob Storage:**
- Microsoft's equivalent to S3
- Student accounts available

---

## ✅ **Quick Test: Can You Modify ghostblaster911?**

Let me create a test script for your existing bucket:

```bash
# Save as: server/scripts/test-s3-permissions.js
```

Would you like me to create this test script to check what you CAN do with your existing `ghostblaster911` bucket?

---

## 📝 **Summary**

**In Real AWS Account:**
1. Create bucket with encryption
2. Add bucket policy allowing PutObject
3. Configure CORS if needed
4. Update .env with bucket name

**In AWS Learner Lab:**
- ❌ Likely cannot create buckets
- ❌ Likely cannot modify bucket policies
- ✅ Might be able to use existing bucket (if created before restrictions)
- **Best option:** Ask professor for less-restricted account OR demonstrate code architecture

---

Want me to create a test script to check what permissions you actually have on `ghostblaster911`?
