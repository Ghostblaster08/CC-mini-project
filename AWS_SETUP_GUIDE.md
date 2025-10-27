# AWS Setup Guide for Ashray Pharmacy System

## Overview
This guide will help you set up all AWS services needed for the Ashray Pharmacy System.

## Prerequisites
- AWS Account
- AWS CLI installed (https://aws.amazon.com/cli/)
- AWS credentials configured

## Step 1: Configure AWS Credentials

### Option A: Using AWS CLI
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region: `us-east-1`
- Default output format: `json`

### Option B: Using Environment Variables
Add to your `.env` file:
```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

## Step 2: Create S3 Bucket for Prescriptions

### Automated Setup (Recommended)
```bash
chmod +x setup-s3.sh
./setup-s3.sh
```

### Manual Setup
1. **Create Bucket:**
   ```bash
   aws s3 mb s3://ashray-prescriptions --region us-east-1
   ```

2. **Enable Versioning:**
   ```bash
   aws s3api put-bucket-versioning \
     --bucket ashray-prescriptions \
     --versioning-configuration Status=Enabled
   ```

3. **Enable Encryption:**
   ```bash
   aws s3api put-bucket-encryption \
     --bucket ashray-prescriptions \
     --server-side-encryption-configuration '{
       "Rules": [{
         "ApplyServerSideEncryptionByDefault": {
           "SSEAlgorithm": "AES256"
         }
       }]
     }'
   ```

4. **Block Public Access:**
   ```bash
   aws s3api put-public-access-block \
     --bucket ashray-prescriptions \
     --public-access-block-configuration \
       "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
   ```

5. **Set CORS Configuration:**
   Create `cors-config.json`:
   ```json
   {
     "CORSRules": [{
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:5173", "http://localhost:5174"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }]
   }
   ```
   
   Apply:
   ```bash
   aws s3api put-bucket-cors \
     --bucket ashray-prescriptions \
     --cors-configuration file://cors-config.json
   ```

## Step 3: Verify S3 Bucket

### Check Bucket Exists:
```bash
aws s3 ls
```

### List Bucket Contents:
```bash
aws s3 ls s3://ashray-prescriptions/
```

### View in AWS Console:
https://s3.console.aws.amazon.com/s3/buckets/ashray-prescriptions?region=us-east-1

## Step 4: MongoDB Atlas Setup

1. **Go to MongoDB Atlas:**
   https://cloud.mongodb.com

2. **Create/Select Cluster:**
   - Cluster name: `ashray-pharmacy`
   - Database name: `ashray-pharmacy`

3. **Network Access:**
   - Click "Network Access" in sidebar
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
   - Or add your specific IP address

4. **Database User:**
   - Already configured: `2023jaidesar_db_user`
   - Password in `.env` file

5. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Already in your `.env` as `MONGODB_URI`

## Step 5: EC2 Setup (For Production Deployment)

### Launch EC2 Instance:
```bash
# From AWS Console or CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.small \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx
```

### Security Group Rules:
- Port 22 (SSH): Your IP
- Port 5000 (Backend API): 0.0.0.0/0
- Port 80/443 (HTTP/HTTPS): 0.0.0.0/0

### Connect to EC2:
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Deploy Backend:
```bash
# On EC2 instance
git clone https://github.com/Ghostblaster08/CC-mini-project.git
cd CC-mini-project/server
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

See `server/DEPLOYMENT.md` for detailed EC2 deployment instructions.

## Step 6: Environment Variables

Ensure your `server/.env` has:
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ashray-pharmacy

# AWS
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=ashray-prescriptions

# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5174

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Step 7: Test AWS Integration

### Test S3 Upload:
```bash
# Upload test file
echo "Test prescription" > test.txt
aws s3 cp test.txt s3://ashray-prescriptions/test/test.txt

# Verify
aws s3 ls s3://ashray-prescriptions/test/

# Download
aws s3 cp s3://ashray-prescriptions/test/test.txt downloaded.txt
cat downloaded.txt
```

### Test from Application:
1. Register/Login to dashboard
2. Upload a prescription (feature to be implemented)
3. Check S3 bucket in AWS Console
4. File should appear in `prescriptions/` folder

## Step 8: Monitor AWS Resources

### S3 Bucket Metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name BucketSizeBytes \
  --dimensions Name=BucketName,Value=ashray-prescriptions \
  --statistics Average \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-12-31T23:59:59Z \
  --period 86400
```

### View in Console:
- **S3**: https://s3.console.aws.amazon.com/
- **EC2**: https://console.aws.amazon.com/ec2/
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/

## Troubleshooting

### Cannot Create S3 Bucket:
- Bucket names must be globally unique
- Try: `ashray-prescriptions-yourname` or `ashray-prescriptions-2025`

### Access Denied Errors:
- Check AWS credentials in `.env`
- Verify IAM user has S3 permissions
- Required policies: `AmazonS3FullAccess`

### MongoDB Connection Failed:
- Whitelist your IP in MongoDB Atlas
- Check connection string format
- Verify username/password

### CORS Errors:
- Update CORS configuration with your frontend URL
- Restart backend server after changes

## Next Steps

1. ✅ S3 bucket created
2. ✅ MongoDB Atlas connected
3. ✅ AWS credentials configured
4. 🔄 Upload prescription feature (in progress)
5. 🔄 EC2 deployment (optional for development)

## Cost Estimate

**Development (Monthly):**
- MongoDB Atlas (Free Tier): $0
- S3 Storage (1GB): ~$0.023
- S3 Requests (1000): ~$0.005
- **Total: <$1/month**

**Production with EC2:**
- EC2 t2.small: ~$17/month
- Total with above: ~$18/month

## Support

For issues:
1. Check `server/DEPLOYMENT.md`
2. Review AWS CloudWatch logs
3. Check application logs: `pm2 logs` (on EC2)
