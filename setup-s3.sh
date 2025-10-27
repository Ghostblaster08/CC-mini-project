#!/bin/bash

# AWS S3 Bucket Setup Script for Ashray Pharmacy
# This script creates the S3 bucket and configures it for prescription storage

BUCKET_NAME="ashray-prescriptions"
REGION="us-east-1"

echo "🚀 Setting up AWS S3 Bucket for Ashray Pharmacy..."
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✓ AWS CLI is configured"
echo ""

# Create S3 bucket
echo "📦 Creating S3 bucket: $BUCKET_NAME..."
if aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null; then
    echo "✓ Bucket created successfully"
else
    echo "⚠️  Bucket might already exist or there was an error"
fi

# Enable versioning
echo "🔄 Enabling versioning..."
aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled

# Configure bucket encryption
echo "🔒 Enabling encryption..."
aws s3api put-bucket-encryption \
    --bucket $BUCKET_NAME \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }'

# Block public access
echo "🛡️  Blocking public access..."
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Create bucket lifecycle policy for old prescriptions
echo "♻️  Setting up lifecycle policy..."
cat > /tmp/lifecycle-policy.json << 'EOF'
{
    "Rules": [
        {
            "Id": "ArchiveOldPrescriptions",
            "Status": "Enabled",
            "Transitions": [
                {
                    "Days": 90,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 180,
                    "StorageClass": "GLACIER"
                }
            ]
        }
    ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
    --bucket $BUCKET_NAME \
    --lifecycle-configuration file:///tmp/lifecycle-policy.json

rm /tmp/lifecycle-policy.json

# Set CORS configuration
echo "🌐 Configuring CORS..."
cat > /tmp/cors-config.json << 'EOF'
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF

aws s3api put-bucket-cors \
    --bucket $BUCKET_NAME \
    --cors-configuration file:///tmp/cors-config.json

rm /tmp/cors-config.json

echo ""
echo "✅ S3 Bucket setup complete!"
echo ""
echo "📊 Bucket Details:"
echo "   Name: $BUCKET_NAME"
echo "   Region: $REGION"
echo "   Versioning: Enabled"
echo "   Encryption: AES256"
echo "   Public Access: Blocked"
echo ""
echo "🔗 View in AWS Console:"
echo "   https://s3.console.aws.amazon.com/s3/buckets/$BUCKET_NAME?region=$REGION"
echo ""
echo "📝 Next Steps:"
echo "   1. Update your .env file with:"
echo "      AWS_S3_BUCKET=$BUCKET_NAME"
echo "      AWS_REGION=$REGION"
echo "   2. Restart your backend server"
echo ""
