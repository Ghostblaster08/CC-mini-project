#!/bin/bash

# Test S3 Pre-signed URL Upload
# This script tests if the pre-signed URL works correctly

echo "🧪 Testing S3 Pre-signed URL Upload"
echo ""

# 1. Create a test PDF file
echo "📄 Creating test PDF file..."
echo "%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 24 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
409
%%EOF" > test-prescription.pdf

echo "✅ Test file created: test-prescription.pdf"
echo ""

# 2. Get pre-signed URL from backend
echo "🔑 Requesting pre-signed URL from backend..."
RESPONSE=$(curl -s "http://localhost:5000/api/upload-url?file=test-prescription.pdf&type=application/pdf")

URL=$(echo $RESPONSE | grep -o '"url":"[^"]*' | cut -d'"' -f4)
CONTENT_TYPE=$(echo $RESPONSE | grep -o '"contentType":"[^"]*' | cut -d'"' -f4)

if [ -z "$URL" ]; then
    echo "❌ Failed to get pre-signed URL"
    echo "Response: $RESPONSE"
    exit 1
fi

echo "✅ Pre-signed URL received"
echo "   Content-Type: $CONTENT_TYPE"
echo ""

# 3. Upload to S3
echo "📤 Uploading to S3..."
UPLOAD_RESPONSE=$(curl -X PUT \
    -H "Content-Type: $CONTENT_TYPE" \
    -T test-prescription.pdf \
    -w "\nHTTP Status: %{http_code}\n" \
    -v \
    "$URL" 2>&1)

echo "$UPLOAD_RESPONSE"
echo ""

# Check result
if echo "$UPLOAD_RESPONSE" | grep -q "HTTP/2 200"; then
    echo "✅ SUCCESS! File uploaded to S3"
    echo ""
    echo "🎉 Your pre-signed URL works correctly!"
    echo "The 403 error is likely due to:"
    echo "  1. CORS configuration missing on S3 bucket"
    echo "  2. AWS Learner Lab blocking PutObject operations"
elif echo "$UPLOAD_RESPONSE" | grep -q "403"; then
    echo "❌ 403 Forbidden - Upload blocked"
    echo ""
    echo "Possible causes:"
    echo "  1. AWS Learner Lab blocking s3:PutObject"
    echo "  2. Bucket CORS not configured"
    echo "  3. Content-Type mismatch (but we matched it)"
    echo ""
    echo "This is expected with AWS Learner Lab restrictions."
else
    echo "❌ Upload failed with unexpected error"
fi

# Cleanup
rm test-prescription.pdf
echo ""
echo "🧹 Cleaned up test file"
