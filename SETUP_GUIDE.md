# Ashray Pharmacy System - Complete Setup Guide

## 📋 Project Overview

Ashray is a cloud-based pharmacy management system that integrates:
- **Patient medication reminders** with adherence tracking
- **Pharmacy prescription management** with inventory control
- **AWS cloud integration** (S3 + EC2)
- **MongoDB Atlas** for scalable database
- **Email notifications** for reminders and alerts

---

## 🏗️ Architecture

```
┌──────────────────┐         ┌────────────────────┐         ┌──────────────┐
│  React Frontend  │────────▶│  Express Backend   │────────▶│   MongoDB    │
│   (Port 5173)    │         │    (Port 5000)     │         │    Atlas     │
└──────────────────┘         └────────────────────┘         └──────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │   AWS S3     │
                              │ (Files/Imgs) │
                              └──────────────┘
```

**Deployment Target:**
- Backend → AWS EC2 Instance
- Files → AWS S3 Bucket
- Database → MongoDB Atlas
- Frontend → Can run on EC2 or locally

---

## 🚀 Quick Start (Local Development)

### Step 1: Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### Step 2: Configure Environment Variables

**Backend (.env):**
```bash
cd server
cp .env.example .env
nano .env
```

Fill in:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ashray
JWT_SECRET=your_random_secret_key_min_32_chars
JWT_EXPIRE=7d
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=ashray-prescriptions
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your_app_password
CLIENT_URL=http://localhost:5173
```

**Frontend (.env):**
```bash
cd client
cp .env.example .env
nano .env
```

Fill in:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Step 4: Test the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health
- Register a new user at: http://localhost:5173/register

---

## ☁️ AWS Setup Guide

### 1. MongoDB Atlas Configuration

1. **Create Account & Cluster**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Choose cloud provider and region

2. **Configure Network Access**
   - Go to Network Access → Add IP Address
   - For development: Add `0.0.0.0/0` (allow all)
   - For production: Add your EC2 instance IP

3. **Create Database User**
   - Go to Database Access → Add New User
   - Choose username and password
   - Give read/write permissions

4. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password
   - Add to `.env` as `MONGODB_URI`

### 2. AWS S3 Bucket Setup

1. **Create S3 Bucket**
   ```bash
   # Via AWS Console:
   - Go to S3 → Create bucket
   - Bucket name: ashray-prescriptions
   - Region: us-east-1 (or your preferred)
   - Block all public access: YES
   - Enable versioning: Optional
   - Create bucket
   ```

2. **Configure CORS**
   - Go to bucket → Permissions → CORS
   - Add this configuration:
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
           "AllowedOrigins": ["*"],
           "ExposeHeaders": ["ETag"]
       }
   ]
   ```

3. **Create IAM User for S3 Access**
   ```bash
   # Via AWS Console:
   - Go to IAM → Users → Add user
   - Username: ashray-s3-user
   - Access type: Programmatic access
   - Attach policy: AmazonS3FullAccess
   - Create user
   - Save Access Key ID and Secret Access Key
   ```

4. **Add to .env**
   ```env
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_S3_BUCKET=ashray-prescriptions
   ```

### 3. Gmail App Password (for Email Notifications)

1. **Enable 2-Factor Authentication**
   - Go to Google Account → Security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to Security → App passwords
   - Select "Mail" and "Other"
   - Name it: "Ashray Pharmacy"
   - Copy the 16-character password

3. **Add to .env**
   ```env
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```

### 4. AWS EC2 Instance Setup

#### Option A: Automated Setup Script

```bash
# 1. Launch EC2 Instance (Ubuntu 22.04, t2.micro)
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 3. Clone repository
git clone https://github.com/Ghostblaster08/CC-mini-project.git
cd CC-mini-project

# 4. Run setup script
cd server
chmod +x setup-ec2.sh
./setup-ec2.sh

# 5. Configure environment
cp .env.example .env
nano .env  # Add all your credentials

# 6. Install dependencies
npm install

# 7. Start with PM2
pm2 start ecosystem.config.json
pm2 save
pm2 startup
```

#### Option B: Manual Setup

**Step 1: Launch EC2 Instance**
- AMI: Ubuntu Server 22.04 LTS
- Instance Type: t2.micro (free tier) or t2.small
- Storage: 20 GB
- Security Group Rules:
  - SSH (22) - Your IP
  - HTTP (80) - 0.0.0.0/0
  - HTTPS (443) - 0.0.0.0/0
  - Custom TCP (5000) - 0.0.0.0/0
  - Custom TCP (5173) - 0.0.0.0/0 (optional)

**Step 2: Connect to EC2**
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

**Step 3: Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Should show v20.x
```

**Step 4: Install PM2 & Nginx**
```bash
sudo npm install -g pm2
sudo apt install -y nginx
```

**Step 5: Clone & Setup Application**
```bash
git clone https://github.com/Ghostblaster08/CC-mini-project.git
cd CC-mini-project/server
npm install
cp .env.example .env
nano .env  # Configure all variables
```

**Step 6: Start Application**
```bash
pm2 start server.js --name ashray-api
pm2 save
pm2 startup  # Follow the command it gives you
```

**Step 7: Configure Nginx (Optional)**
```bash
sudo nano /etc/nginx/sites-available/ashray
```

Add:
```nginx
server {
    listen 80;
    server_name your-ec2-ip;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ashray /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🧪 Testing Your Setup

### 1. Test Backend API
```bash
# Health check
curl http://localhost:5000/api/health

# Or on EC2
curl http://your-ec2-ip:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Ashray Pharmacy API is running on AWS EC2",
  "timestamp": "2025-10-27T..."
}
```

### 2. Test Frontend
- Open browser: http://localhost:5173
- Click "Sign up"
- Register as a patient
- Should redirect to dashboard

### 3. Test S3 Upload
- Login as patient
- Go to Prescriptions
- Upload a prescription image
- Should upload to S3 successfully

### 4. Test MongoDB Connection
```bash
cd server
node -e "require('dotenv').config(); require('./config/db')();"
```

Should see: "✅ MongoDB Atlas Connected"

### 5. Test Email Notifications
- Create a medication schedule
- Wait for the scheduled time
- Check email for reminder

---

## 📊 Database Schema

### Users
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['patient', 'pharmacy', 'caregiver', 'admin'],
  phone: String,
  address: Object
}
```

### Medications
```javascript
{
  patient: ObjectId,
  name: String,
  dosage: String,
  frequency: String,
  schedule: [{time: String, taken: Boolean}],
  startDate: Date,
  endDate: Date,
  adherenceHistory: Array
}
```

### Prescriptions
```javascript
{
  patient: ObjectId,
  pharmacy: ObjectId,
  prescriptionNumber: String,
  prescribedBy: Object,
  medications: Array,
  prescriptionImage: {url, key},
  status: ['pending', 'processing', 'ready', 'completed']
}
```

### Inventory
```javascript
{
  pharmacy: ObjectId,
  medicationName: String,
  category: String,
  quantity: Number,
  reorderLevel: Number,
  price: Number,
  expiryDate: Date
}
```

---

## 🔐 Security Checklist

- [ ] Strong JWT secret (min 32 characters)
- [ ] MongoDB Atlas IP whitelist configured
- [ ] S3 bucket is private (not public)
- [ ] Gmail app password (not regular password)
- [ ] EC2 security groups properly configured
- [ ] HTTPS/SSL certificate installed (production)
- [ ] Environment variables never committed to Git
- [ ] CORS properly configured

---

## 🐛 Common Issues & Solutions

### Issue: "MongoDB connection failed"
**Solution:**
- Check connection string format
- Verify MongoDB Atlas IP whitelist
- Ensure database user has correct permissions

### Issue: "S3 upload failed"
**Solution:**
- Verify AWS credentials in `.env`
- Check S3 bucket CORS configuration
- Ensure IAM user has S3 permissions

### Issue: "Email not sending"
**Solution:**
- Use Gmail App Password, not regular password
- Enable 2FA on Gmail account
- Check SMTP settings (port 587 for TLS)

### Issue: "Cannot connect to backend API"
**Solution:**
- Check backend is running: `pm2 list`
- Verify port 5000 is open
- Check `VITE_API_URL` in frontend `.env`

### Issue: "PM2 not starting on reboot"
**Solution:**
```bash
pm2 save
pm2 startup
# Run the command it outputs
```

---

## 📝 Default User Roles

- **patient**: Access to medication tracking, prescriptions
- **pharmacy**: Manage inventory, process prescriptions
- **caregiver**: View patient medications, help manage
- **admin**: Full system access

---

## 🔄 Updating the Application

```bash
# On EC2 instance
cd CC-mini-project
git pull origin main

# Update backend
cd server
npm install
pm2 restart ashray-api

# Update frontend (if hosted on EC2)
cd ../client
npm install
npm run build
pm2 restart ashray-client
```

---

## 📞 Support

For issues:
1. Check the logs: `pm2 logs ashray-api`
2. Review this guide thoroughly
3. Open an issue on GitHub

---

**Built by Group 3 for Cloud Computing Course 2025**
