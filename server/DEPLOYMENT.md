# Ashray Pharmacy System - EC2 Deployment Guide

## Prerequisites
- AWS Account with EC2 access
- AWS S3 Bucket created
- MongoDB Atlas account and cluster
- Domain name (optional)

## Step 1: Create an EC2 Instance

1. **Launch EC2 Instance**:
   - Go to AWS Console → EC2
   - Click "Launch Instance"
   - Choose Ubuntu Server 22.04 LTS
   - Instance type: t2.micro (free tier) or t2.small
   - Configure security group:
     - SSH (22) - Your IP
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
     - Custom TCP (5000) - 0.0.0.0/0 (for API)
     - Custom TCP (5173) - 0.0.0.0/0 (for Vite dev server, optional)
   - Create or select a key pair
   - Launch instance

2. **Connect to EC2**:
   ```bash
   chmod 400 your-key.pem
   ssh -i your-key.pem ubuntu@your-ec2-public-ip
   ```

## Step 2: Set Up Server Environment

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

## Step 3: Clone and Setup Application

```bash
# Clone your repository
cd /home/ubuntu
git clone https://github.com/Ghostblaster08/CC-mini-project.git
cd CC-mini-project

# Setup Backend
cd server
npm install

# Create .env file
cp .env.example .env
nano .env
```

**Configure your .env file**:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
CLIENT_URL=http://your-ec2-public-ip
```

```bash
# Start backend with PM2
pm2 start server.js --name ashray-api
pm2 save
pm2 startup
```

## Step 4: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/ashray
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-ec2-public-ip or your-domain.com;

    # API Backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (if serving from EC2)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/ashray /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: Setup Frontend (Optional - if hosting on EC2)

```bash
cd /home/ubuntu/CC-mini-project/client
npm install

# Build for production
npm run build

# Or run dev server
pm2 start "npm run dev" --name ashray-client
```

## Step 6: Configure AWS S3 Bucket

1. Go to AWS S3 Console
2. Create bucket: `ashray-prescriptions`
3. Configure CORS:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```
4. Set bucket policy for EC2 access
5. Create IAM user with S3 access
6. Save Access Key and Secret Key

## Step 7: MongoDB Atlas Setup

1. Create cluster on MongoDB Atlas
2. Network Access → Add IP: 0.0.0.0/0 (or your EC2 IP)
3. Database Access → Create user
4. Connect → Get connection string
5. Update `.env` with connection string

## Step 8: SSL Certificate (Optional - Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl status certbot.timer
```

## Step 9: Monitoring and Maintenance

```bash
# View PM2 processes
pm2 list
pm2 logs ashray-api
pm2 monit

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart ashray-api
sudo systemctl restart nginx
```

## Step 10: Update Application

```bash
cd /home/ubuntu/CC-mini-project
git pull origin main
cd server
npm install
pm2 restart ashray-api
```

## Environment Variables Checklist

- [ ] MongoDB Atlas connection string
- [ ] JWT secret key
- [ ] AWS credentials (Access Key & Secret)
- [ ] S3 bucket name
- [ ] Email credentials (Gmail app password)
- [ ] Client URL (EC2 public IP or domain)

## Testing

1. Test API: `http://your-ec2-ip/api/health`
2. Test Frontend: `http://your-ec2-ip`
3. Test S3 uploads via prescription upload feature
4. Test email notifications

## Security Checklist

- [ ] Security group properly configured
- [ ] Strong JWT secret
- [ ] MongoDB Atlas IP whitelist
- [ ] S3 bucket permissions
- [ ] SSL certificate installed
- [ ] Environment variables secured
- [ ] Firewall configured (UFW)

## Troubleshooting

**Backend not starting:**
```bash
pm2 logs ashray-api
cd /home/ubuntu/CC-mini-project/server && node server.js
```

**MongoDB connection error:**
- Check connection string in `.env`
- Verify IP whitelist in MongoDB Atlas
- Check network access

**S3 upload failing:**
- Verify AWS credentials
- Check S3 bucket CORS
- Check IAM permissions

**Email not sending:**
- Use Gmail App Password (not regular password)
- Enable "Less secure app access" or use App Password
- Check SMTP settings
