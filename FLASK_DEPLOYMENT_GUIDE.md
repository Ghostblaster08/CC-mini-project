# 🧬 AI-Powered Prescription Parser Deployment Guide

This guide will help you set up a Flask service on EC2 for parsing prescription PDFs and integrating it with your existing Node.js application.

## 📋 Overview

**What this adds to your system:**
- 🤖 **AI-powered PDF parsing** using OCR and pattern recognition
- 💊 **Automatic medication extraction** from prescription images/PDFs
- 🔄 **Seamless integration** with your existing S3 upload system
- ⚡ **Real-time processing** when prescriptions are uploaded
- 📱 **Frontend interface** to create medication schedules from parsed data

## 🏗️ Architecture

```
📱 Frontend (React) 
    ↓ Upload prescription
🌐 Node.js Backend (EC2)
    ↓ Store in S3 → Send to Flask
🤖 Flask Parser (EC2)
    ↓ Parse & extract medications
💊 Display in Dashboard
    ↓ Create medication schedules
📅 Medication Management
```

## 🚀 Deployment Steps

### Step 1: Launch EC2 Instance for Flask Service

```bash
# 1. Launch a new EC2 instance (Ubuntu 20.04 LTS)
# - Instance type: t2.micro (free tier) or t2.small
# - Security group: Allow ports 22 (SSH), 80 (HTTP), 5000 (Flask)
# - Key pair: Use your existing key or create new one

# 2. Connect to your EC2 instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### Step 2: Deploy Flask Service

```bash
# Upload Flask service files to EC2
scp -i your-key.pem -r flask-service/ ubuntu@YOUR_EC2_IP:/tmp/

# SSH to EC2 and run deployment script
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
chmod +x /tmp/flask-service/deploy-ec2.sh
/tmp/flask-service/deploy-ec2.sh
```

### Step 3: Verify Flask Service

```bash
# Check service status
sudo systemctl status prescription-parser

# Test health endpoint
curl http://YOUR_EC2_IP/health

# View logs
sudo journalctl -u prescription-parser -f
```

### Step 4: Update Node.js Backend

```bash
# In your server directory, install new dependencies
cd server
npm install node-fetch@3.3.2 form-data@4.0.0

# Update environment variable
# Edit .env file and set:
FLASK_SERVICE_URL=http://YOUR_EC2_IP:5000
```

### Step 5: Test Integration

```bash
# Test the Flask service locally first
cd flask-service
python test_flask_service.py YOUR_EC2_IP

# Test end-to-end integration
# 1. Upload a prescription via your frontend
# 2. Check if medications are parsed and displayed
# 3. Create medication schedules from parsed data
```

## 🔧 Configuration

### Flask Service Configuration

**Environment Variables (on EC2):**
```bash
# No additional environment variables needed
# Service runs on port 5000 by default
```

**Service Files:**
```bash
# Service definition
/etc/systemd/system/prescription-parser.service

# Application files
/opt/prescription-parser/
├── app.py                    # Main Flask application
├── requirements.txt          # Python dependencies
├── health-check.sh          # Health monitoring script
└── venv/                    # Python virtual environment
```

### Node.js Backend Configuration

**Add to `.env`:**
```env
FLASK_SERVICE_URL=http://YOUR_EC2_IP:5000
```

**New API Endpoints:**
- `POST /api/prescriptions/:id/parse` - Reparse prescription
- `POST /api/prescriptions/:id/create-medications` - Create medication schedules

## 🧪 Testing

### Test Flask Service Directly

```bash
# Health check
curl http://YOUR_EC2_IP:5000/health

# Test text parsing
curl -X POST http://YOUR_EC2_IP:5000/parse-text \
  -H "Content-Type: application/json" \
  -d '{"text":"1. Metformin 500mg - twice daily\n2. Aspirin 75mg - once daily"}'

# Test file upload (with actual PDF)
curl -X POST http://YOUR_EC2_IP:5000/parse-prescription \
  -F "file=@prescription.pdf"
```

### Test Integration

1. **Upload Prescription:**
   - Go to your frontend `/prescriptions` page
   - Upload a prescription PDF/image
   - Check console logs for parsing results

2. **View Parsed Medications:**
   - Go to Dashboard
   - Look for "Parsed Medications" section
   - Verify medications are displayed with AI Parsed badges

3. **Create Medication Schedules:**
   - Select medications you want to schedule
   - Click "Create Medication Schedules"
   - Verify they appear in your medications list

## 🔍 Monitoring & Troubleshooting

### Flask Service Logs

```bash
# Real-time logs
sudo journalctl -u prescription-parser -f

# Recent logs
sudo journalctl -u prescription-parser -n 50

# Error logs
sudo journalctl -u prescription-parser -p err
```

### Common Issues

**1. Service Not Starting:**
```bash
# Check service status
sudo systemctl status prescription-parser

# Check Python environment
source /opt/prescription-parser/venv/bin/activate
python -c "import app; print('OK')"
```

**2. OCR Not Working:**
```bash
# Check Tesseract installation
tesseract --version

# Test OCR directly
tesseract image.png output.txt
```

**3. Network Issues:**
```bash
# Check port accessibility
sudo netstat -tlnp | grep 5000

# Check firewall
sudo ufw status
```

**4. Node.js Integration Issues:**
```bash
# Check Flask service URL in logs
grep "Flask service" server/logs/*

# Test network connectivity from Node.js server
curl http://YOUR_EC2_IP:5000/health
```

## 📊 Performance Optimization

### Flask Service

```bash
# Increase Gunicorn workers for better performance
sudo nano /etc/systemd/system/prescription-parser.service

# Change workers from 2 to 4:
ExecStart=/opt/prescription-parser/venv/bin/gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 120 app:app

# Restart service
sudo systemctl daemon-reload
sudo systemctl restart prescription-parser
```

### Nginx Caching (Optional)

```bash
# Add caching to Nginx config
sudo nano /etc/nginx/sites-available/prescription-parser

# Add to location block:
location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_cache_valid 200 1m;
    proxy_cache_bypass $http_cache_control;
    client_max_body_size 20M;
}
```

## 🔒 Security

### SSL Certificate (Production)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### API Security

```bash
# Add API key authentication (optional)
# Edit flask-service/app.py to add API key validation

# Update Node.js service to include API key
# Edit server/services/prescriptionParserService.js
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Deploy multiple Flask instances
# Use load balancer (ALB) to distribute traffic
# Update FLASK_SERVICE_URL to load balancer URL
```

### Vertical Scaling

```bash
# Upgrade EC2 instance type
# Increase Gunicorn workers
# Add more memory for OCR processing
```

## ✅ Verification Checklist

- [ ] EC2 instance launched and accessible
- [ ] Flask service deployed and running
- [ ] Health check endpoint responding
- [ ] Node.js backend updated with Flask URL
- [ ] Dependencies installed (node-fetch, form-data)
- [ ] Upload prescription test successful
- [ ] Medications parsed and displayed
- [ ] Medication schedules created successfully
- [ ] Monitoring and logs configured

## 🆘 Support

**If you encounter issues:**

1. **Check Flask service logs:** `sudo journalctl -u prescription-parser -f`
2. **Verify network connectivity:** `curl http://YOUR_EC2_IP:5000/health`
3. **Test with sample prescription:** Use the test script in `flask-service/`
4. **Check Node.js logs:** Look for Flask service errors in server logs

**For debugging:**
- Use the health check script: `/opt/prescription-parser/health-check.sh`
- Enable debug mode in Flask (development only)
- Check S3 file accessibility from EC2
- Verify prescription file formats are supported

---

🎉 **Congratulations!** You now have an AI-powered prescription parser integrated with your pharmacy management system!