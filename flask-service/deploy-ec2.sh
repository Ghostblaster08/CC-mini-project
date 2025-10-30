#!/bin/bash

# EC2 Flask Service Deployment Script
# This script sets up the Flask prescription parsing service on EC2

set -e

echo "🚀 Starting Flask service deployment on EC2..."

# Update system
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install Python and pip
echo "🐍 Installing Python and dependencies..."
sudo apt install -y python3 python3-pip python3-venv

# Install system dependencies for OCR
echo "👁️ Installing OCR dependencies..."
sudo apt install -y tesseract-ocr tesseract-ocr-eng
sudo apt install -y libpoppler-cpp-dev pkg-config python3-dev

# Install additional image processing libraries
sudo apt install -y libjpeg-dev zlib1g-dev libtiff-dev libfreetype6-dev liblcms2-dev libwebp-dev

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/prescription-parser
sudo chown -R ubuntu:ubuntu /opt/prescription-parser
cd /opt/prescription-parser

# Create virtual environment
echo "🔧 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Copy application files (assuming they are uploaded to /tmp)
echo "📋 Copying application files..."
cp /tmp/flask-service/* /opt/prescription-parser/ 2>/dev/null || echo "Files will be uploaded separately"

# Install Python requirements
echo "⚙️ Installing Python packages..."
if [ -f "requirements.txt" ]; then
    pip install --upgrade pip
    pip install -r requirements.txt
else
    echo "requirements.txt not found, installing packages manually..."
    pip install --upgrade pip
    pip install Flask==2.3.3
    pip install Flask-CORS==4.0.0
    pip install PyPDF2==3.0.1
    pip install PyMuPDF==1.23.7
    pip install Pillow==10.0.1
    pip install pytesseract==0.3.10
    pip install requests==2.31.0
    pip install Werkzeug==2.3.7
    pip install gunicorn==21.2.0
fi

# Create systemd service file
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/prescription-parser.service > /dev/null <<EOF
[Unit]
Description=Prescription Parser Flask Service
After=network.target

[Service]
Type=exec
User=ubuntu
Group=ubuntu
WorkingDirectory=/opt/prescription-parser
Environment=PATH=/opt/prescription-parser/venv/bin
ExecStart=/opt/prescription-parser/venv/bin/gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 120 app:app
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create nginx configuration (optional, for production)
echo "🌐 Setting up Nginx (optional)..."
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/prescription-parser > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 20M;
    }
}
EOF

# Enable nginx site
sudo ln -sf /etc/nginx/sites-available/prescription-parser /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Set up firewall rules
echo "🔒 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 5000

# Create log directory
sudo mkdir -p /var/log/prescription-parser
sudo chown -R ubuntu:ubuntu /var/log/prescription-parser

# Enable and start services
echo "🎬 Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable prescription-parser
sudo systemctl start prescription-parser
sudo systemctl enable nginx
sudo systemctl restart nginx

# Create health check script
tee /opt/prescription-parser/health-check.sh > /dev/null <<EOF
#!/bin/bash
echo "🏥 Health Check - Prescription Parser Service"
echo "=============================================="
echo "Service Status:"
sudo systemctl status prescription-parser --no-pager
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager
echo ""
echo "Service Endpoint Test:"
curl -s http://localhost:5000/health | jq '.' || echo "Service not responding"
echo ""
echo "Port Status:"
sudo netstat -tlnp | grep -E ':(80|5000)'
EOF

chmod +x /opt/prescription-parser/health-check.sh

echo "✅ Flask service deployment completed!"
echo ""
echo "🔍 Service Information:"
echo "- Service Status: sudo systemctl status prescription-parser"
echo "- Service Logs: sudo journalctl -u prescription-parser -f"
echo "- Health Check: /opt/prescription-parser/health-check.sh"
echo "- Service URL: http://YOUR_EC2_IP/"
echo "- Direct Flask URL: http://YOUR_EC2_IP:5000/"
echo ""
echo "📋 Next Steps:"
echo "1. Upload your Flask app files to /opt/prescription-parser/"
echo "2. Restart the service: sudo systemctl restart prescription-parser"
echo "3. Check health: curl http://YOUR_EC2_IP/health"
echo "4. Update your Node.js backend with the EC2 Flask service URL"