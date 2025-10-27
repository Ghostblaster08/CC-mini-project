# AWS Configuration Checklist

Use this checklist to ensure all AWS services are properly configured.

## ✅ AWS S3 Bucket

### Creation
- [ ] Bucket created with name: `ashray-prescriptions`
- [ ] Region selected: `us-east-1` (or your preferred region)
- [ ] Block all public access: **ENABLED**
- [ ] Versioning: Optional (recommended for production)

### CORS Configuration
- [ ] CORS policy added to bucket permissions

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

### IAM User for S3 Access
- [ ] IAM user created: `ashray-s3-user`
- [ ] Access type: Programmatic access
- [ ] Policy attached: `AmazonS3FullAccess`
- [ ] Access Key ID saved to `.env`
- [ ] Secret Access Key saved to `.env`

---

## ✅ AWS EC2 Instance

### Instance Configuration
- [ ] Instance launched
- [ ] AMI: Ubuntu Server 22.04 LTS
- [ ] Instance type: t2.micro or t2.small
- [ ] Storage: 20 GB minimum
- [ ] Key pair created and downloaded (`.pem` file)

### Security Group Rules
- [ ] SSH (port 22) - Your IP only
- [ ] HTTP (port 80) - 0.0.0.0/0
- [ ] HTTPS (port 443) - 0.0.0.0/0
- [ ] Custom TCP (port 5000) - 0.0.0.0/0 (API)
- [ ] Optional: Custom TCP (port 5173) - 0.0.0.0/0 (Dev frontend)

### EC2 Setup Steps
- [ ] SSH connection tested
- [ ] Node.js 20.x installed
- [ ] PM2 installed globally
- [ ] Nginx installed (optional)
- [ ] Git installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Application started with PM2
- [ ] PM2 configured to start on boot

### Verification Commands
```bash
# Check Node.js
node -v  # Should show v20.x

# Check PM2
pm2 list  # Should show ashray-api running

# Check application
curl http://localhost:5000/api/health

# Check from outside
curl http://YOUR_EC2_PUBLIC_IP:5000/api/health
```

---

## ✅ MongoDB Atlas

### Cluster Setup
- [ ] MongoDB Atlas account created
- [ ] Free tier cluster created
- [ ] Cloud provider and region selected
- [ ] Cluster deployed and active

### Network Access
- [ ] IP whitelist configured
  - Development: `0.0.0.0/0` (allow all)
  - Production: Add EC2 instance public IP

### Database Access
- [ ] Database user created
- [ ] Username and password saved
- [ ] User role: Read and write to any database
- [ ] Connection string obtained
- [ ] Connection string added to `.env`

### Connection String Format
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ashray-pharmacy?retryWrites=true&w=majority
```

### Verification
- [ ] Connection tested from backend
- [ ] Database name: `ashray-pharmacy` (or your choice)
- [ ] Collections auto-created on first use

---

## ✅ Email Service (Gmail)

### Gmail Account Setup
- [ ] Gmail account created or existing account used
- [ ] 2-Factor Authentication enabled
- [ ] App Password generated
- [ ] App Password saved to `.env`

### Configuration in .env
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # 16-char app password
```

### Verification
- [ ] Test email sent successfully
- [ ] Medication reminder emails working
- [ ] Prescription notification emails working

---

## ✅ Environment Variables

### Backend .env File
- [ ] `PORT=5000`
- [ ] `NODE_ENV=production` (or development)
- [ ] `MONGODB_URI=mongodb+srv://...`
- [ ] `JWT_SECRET=<strong_random_string>`
- [ ] `JWT_EXPIRE=7d`
- [ ] `AWS_ACCESS_KEY_ID=AKIA...`
- [ ] `AWS_SECRET_ACCESS_KEY=...`
- [ ] `AWS_REGION=us-east-1`
- [ ] `AWS_S3_BUCKET=ashray-prescriptions`
- [ ] `EMAIL_HOST=smtp.gmail.com`
- [ ] `EMAIL_PORT=587`
- [ ] `EMAIL_USER=your.email@gmail.com`
- [ ] `EMAIL_PASSWORD=<app_password>`
- [ ] `CLIENT_URL=http://your-ec2-ip:5173` or production URL

### Frontend .env File
- [ ] `VITE_API_URL=http://localhost:5000/api` (development)
- [ ] `VITE_API_URL=http://your-ec2-ip:5000/api` (production)

---

## ✅ Testing Checklist

### Backend API Tests
- [ ] Health check: `GET /api/health` returns 200 OK
- [ ] User registration: `POST /api/auth/register` works
- [ ] User login: `POST /api/auth/login` works
- [ ] JWT token issued and validated
- [ ] Protected routes require authentication

### S3 Integration Tests
- [ ] Prescription image upload works
- [ ] File appears in S3 bucket
- [ ] Signed URL generated for private files
- [ ] File deletion from S3 works

### Database Tests
- [ ] MongoDB connection successful
- [ ] User document created
- [ ] Medication document created
- [ ] Prescription document created
- [ ] Inventory document created
- [ ] Queries work correctly

### Email Tests
- [ ] Test email sent manually
- [ ] Medication reminder scheduled and sent
- [ ] Prescription ready notification sent
- [ ] Email content properly formatted

### Frontend Tests
- [ ] Frontend loads without errors
- [ ] Registration form works
- [ ] Login form works
- [ ] Dashboard displays data
- [ ] API calls successful
- [ ] File upload works
- [ ] Notifications appear

---

## ✅ Security Checklist

### AWS Security
- [ ] S3 bucket is private (not public)
- [ ] EC2 security group limits SSH to your IP
- [ ] IAM user has minimal required permissions
- [ ] AWS credentials never committed to Git

### Application Security
- [ ] JWT secret is strong (min 32 chars)
- [ ] Passwords are hashed with bcrypt
- [ ] CORS properly configured
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using Mongoose)
- [ ] XSS protection enabled

### MongoDB Security
- [ ] Strong database password
- [ ] IP whitelist configured
- [ ] Connection string not exposed
- [ ] User has limited permissions

### Email Security
- [ ] Using app password, not account password
- [ ] 2FA enabled on Gmail account
- [ ] Email credentials secured in .env

---

## ✅ Production Readiness

### Performance
- [ ] PM2 configured for cluster mode (optional)
- [ ] Database indexes created (if needed)
- [ ] Nginx configured as reverse proxy
- [ ] Static files served efficiently

### Monitoring
- [ ] PM2 monitoring enabled
- [ ] Application logs accessible
- [ ] Error logging configured
- [ ] Uptime monitoring (optional)

### Backup & Recovery
- [ ] MongoDB backups configured
- [ ] S3 versioning enabled (optional)
- [ ] EC2 snapshots scheduled (optional)
- [ ] Disaster recovery plan documented

### SSL/HTTPS (Production)
- [ ] Domain name configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Nginx configured for HTTPS
- [ ] HTTP to HTTPS redirect enabled

---

## 🎯 Quick Reference

### AWS EC2 Public IP
```
Your EC2 IP: ___________________
```

### MongoDB Atlas Connection
```
Cluster: ___________________
Database: ashray-pharmacy
```

### S3 Bucket
```
Bucket Name: ashray-prescriptions
Region: us-east-1
```

### Application URLs
```
Frontend: http://___________________
Backend API: http://___________________:5000/api
Health Check: http://___________________:5000/api/health
```

---

## 📞 Support Commands

### Check EC2 Status
```bash
pm2 status
pm2 logs ashray-api
sudo systemctl status nginx
```

### Restart Services
```bash
pm2 restart ashray-api
sudo systemctl restart nginx
```

### View Logs
```bash
pm2 logs ashray-api --lines 100
tail -f /var/log/nginx/error.log
```

### Check Disk Space
```bash
df -h
```

### Check Memory
```bash
free -h
```

---

**Complete this checklist before deploying to production!**
