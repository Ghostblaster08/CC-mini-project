#!/bin/bash

# Test Direct S3 Upload via Backend
# This tests if server-side S3 upload works with Learner Lab

echo "🧪 Testing Server-Side S3 Upload"
echo ""

# Check if server is running
if ! curl -s http://localhost:5000/api/auth/me > /dev/null 2>&1; then
    echo "❌ Backend server is not running"
    echo "Start it with: cd server && node server.js"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

# Create a test PDF file
echo "📄 Creating test prescription file..."
cat > test-upload.pdf << 'EOF'
%PDF-1.4
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
(Test Prescription) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000231 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
323
%%EOF
EOF

echo "✅ Test file created"
echo ""

# Login and get token
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed. Creating test user..."
    
    # Register test user
    REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Test Patient",
        "email": "testpatient@test.com",
        "password": "password123",
        "role": "patient",
        "phone": "1234567890"
      }')
    
    TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo "❌ Failed to create test user"
        echo "Response: $REGISTER_RESPONSE"
        rm test-upload.pdf
        exit 1
    fi
fi

echo "✅ Authenticated (token received)"
echo ""

# Upload prescription via backend
echo "📤 Uploading prescription to backend (will attempt S3)..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:5000/api/prescriptions \
  -H "Authorization: Bearer $TOKEN" \
  -F "prescriptionFile=@test-upload.pdf" \
  -F "prescriptionNumber=TEST-$(date +%s)" \
  -F "doctorName=Dr. Test" \
  -F "prescriptionDate=$(date +%Y-%m-%d)" \
  -F "notes=Server-side S3 upload test")

echo "$UPLOAD_RESPONSE" | jq . 2>/dev/null || echo "$UPLOAD_RESPONSE"
echo ""

# Check if upload succeeded
if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Prescription created successfully!"
    
    # Check if it uploaded to S3 or local
    if echo "$UPLOAD_RESPONSE" | grep -q '"uploadedToS3":true'; then
        echo "🎉 SUCCESS! File uploaded to S3!"
        echo ""
        S3_URL=$(echo "$UPLOAD_RESPONSE" | grep -o '"url":"[^"]*' | head -1 | cut -d'"' -f4)
        echo "S3 URL: $S3_URL"
    elif echo "$UPLOAD_RESPONSE" | grep -q 'ghostblaster911.s3'; then
        echo "🎉 SUCCESS! File uploaded to S3!"
        S3_URL=$(echo "$UPLOAD_RESPONSE" | grep -o 'https://ghostblaster911[^"]*' | head -1)
        echo "S3 URL: $S3_URL"
    else
        echo "⚠️  File saved locally (S3 blocked)"
        LOCAL_URL=$(echo "$UPLOAD_RESPONSE" | grep -o '"/uploads/[^"]*' | head -1 | tr -d '"')
        echo "Local URL: $LOCAL_URL"
    fi
else
    echo "❌ Upload failed"
    echo "Check server logs for details"
fi

# Cleanup
rm test-upload.pdf
echo ""
echo "🧹 Cleaned up test file"
