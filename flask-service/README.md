# Flask Prescription Parser Service

A Python Flask microservice that extracts medication information from prescription PDFs and images using OCR and pattern matching.

## Features

- 📄 **PDF Text Extraction**: Multiple extraction methods (PyMuPDF, PyPDF2, OCR fallback)
- 🖼️ **Image OCR**: Extract text from prescription images using Tesseract
- 💊 **Medication Parsing**: Advanced pattern matching to identify medications, dosages, and frequencies
- 🔗 **S3 Integration**: Direct file processing from S3 URLs
- 🏥 **Health Monitoring**: Built-in health check endpoints
- 🚀 **Production Ready**: Gunicorn WSGI server with Nginx reverse proxy

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Install Tesseract OCR (required for image processing)
# Ubuntu/Debian:
sudo apt install tesseract-ocr tesseract-ocr-eng

# macOS:
brew install tesseract

# Windows:
# Download from: https://github.com/UB-Mannheim/tesseract/wiki

# Run the service
python app.py
```

### EC2 Deployment

```bash
# 1. Launch EC2 instance (Ubuntu 20.04 LTS recommended)
# 2. Copy deployment script to EC2
scp deploy-ec2.sh ubuntu@YOUR_EC2_IP:/tmp/

# 3. Copy Flask app files to EC2
scp -r * ubuntu@YOUR_EC2_IP:/tmp/flask-service/

# 4. SSH to EC2 and run deployment
ssh ubuntu@YOUR_EC2_IP
chmod +x /tmp/deploy-ec2.sh
/tmp/deploy-ec2.sh
```

## API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "prescription-parser",
  "timestamp": "2025-10-30T12:00:00.000Z"
}
```

### Parse Prescription File
```http
POST /parse-prescription
Content-Type: multipart/form-data

file: [prescription.pdf]
```

**Or with S3 URL:**
```http
POST /parse-prescription
Content-Type: application/json

{
  "file_url": "https://s3.amazonaws.com/bucket/prescription.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "extracted_text_length": 1250,
  "medications_found": 3,
  "medications": [
    {
      "name": "Metformin Hydrochloride",
      "dosage": "500mg",
      "frequency": "twice daily",
      "instructions": "Take 500mg twice daily",
      "parsed_at": "2025-10-30T12:00:00.000Z"
    }
  ],
  "processed_at": "2025-10-30T12:00:00.000Z"
}
```

### Parse Text Directly
```http
POST /parse-text
Content-Type: application/json

{
  "text": "1. Metformin 500mg - twice daily\n2. Aspirin 75mg - once daily"
}
```

## Supported File Types

- **PDF**: Medical prescriptions, lab reports
- **Images**: PNG, JPG, JPEG (processed with OCR)

## Medication Parsing Patterns

The service uses multiple pattern matching strategies:

1. **Structured Patterns**: `Medicine Name - Dosage - Frequency`
2. **Numbered Lists**: `1. Medicine Name Dosage Frequency`
3. **Parenthetical Dosage**: `Medicine Name (Dosage) - Frequency`
4. **Keyword-based Parsing**: Identifies medication-related terms

## Configuration

Environment variables:
- `PORT`: Service port (default: 5000)
- `MAX_CONTENT_LENGTH`: Maximum upload size (default: 16MB)

## Production Setup

The deployment script configures:
- ✅ Gunicorn WSGI server (2 workers, 120s timeout)
- ✅ Nginx reverse proxy
- ✅ Systemd service management
- ✅ UFW firewall configuration
- ✅ Automatic service restart
- ✅ Health monitoring

## Service Management

```bash
# Check service status
sudo systemctl status prescription-parser

# View logs
sudo journalctl -u prescription-parser -f

# Restart service
sudo systemctl restart prescription-parser

# Run health check
/opt/prescription-parser/health-check.sh
```

## Integration with Node.js Backend

Add to your Node.js prescription route:

```javascript
// After successful upload, parse prescription
if (prescriptionFileData?.uploadedToS3) {
  try {
    const parseResponse = await fetch('http://YOUR_EC2_IP:5000/parse-prescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_url: prescriptionFileData.url })
    });
    
    const parseResult = await parseResponse.json();
    if (parseResult.success && parseResult.medications.length > 0) {
      prescriptionData.parsedMedications = parseResult.medications;
    }
  } catch (error) {
    console.error('Prescription parsing failed:', error);
  }
}
```

## Error Handling

The service includes comprehensive error handling:
- File validation and sanitization
- OCR failure fallbacks
- Network timeout handling
- Detailed logging for debugging

## Security Considerations

- File size limits (16MB default)
- Secure filename handling
- Temporary file cleanup
- CORS configuration for specific origins
- Firewall rules (ports 80, 5000, SSH only)