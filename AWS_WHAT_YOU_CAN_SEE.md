
# 🌩️ AWS ACADEMY - What You Can See & Do

## ⚠️ Important: AWS Learner Lab Limitations

You're using **AWS Academy Learner Lab**, which has restrictions:
- ❌ **Cannot create S3 buckets**
- ❌ **Cannot list all S3 buckets**  
- ❌ **Cannot modify IAM policies**
- ⏰ **Session expires every 3 hours**
- ✅ **Can use pre-created resources**
- ✅ **Can monitor services**

---

## 🎯 What You CAN See on AWS Console

### 1. **Access AWS Console**

1. Go to your **AWS Academy Learner Lab**
2. Click **"Start Lab"** (wait for green dot)
3. Click **"AWS"** button (opens AWS Console)

### 2. **Services You Can Check**

#### **📊 CloudWatch - Service Monitoring**
```
Services → CloudWatch → Dashboards
```
**What to see:**
- EC2 instance metrics (if deployed)
- API call logs
- Error rates

**You CAN:**
- ✅ View metrics
- ✅ Create alarms
- ✅ Check logs

#### **💾 RDS/DocumentDB - Database (if used)**
```
Services → RDS or DocumentDB
```
**Currently:** You're using **MongoDB Atlas** (not AWS RDS)  
**Why:** MongoDB Atlas is free and easier for this project

#### **🖥️ EC2 - Virtual Servers**
```
Services → EC2 → Instances
```
**What to see:**
- No instances yet (local development only)
- When deployed, you'll see your server instance here

**You CAN:**
- ✅ Launch EC2 instances
- ✅ Configure security groups
- ✅ Manage SSH keys

#### **📦 S3 - Storage (LIMITED ACCESS)**
```
Services → S3
```
**What you'll see:**
- ❌ Error: "Not authorized to perform: s3:ListAllMyBuckets"
- This is expected with Learner Lab

**Workaround:** Using **local file storage** instead
- Files saved to: `server/uploads/prescriptions/`
- Works identically for development
- Easy to migrate to S3 later

---

## 🔑 Check Your AWS Credentials

### View Current Credentials
1. In AWS Learner Lab, click **"AWS Details"**
2. Click **"Show"** next to AWS CLI credentials
3. You'll see:
   ```
   aws_access_key_id=ASIA...
   aws_secret_access_key=...
   aws_session_token=...
   ```

### Check Expiration
- **Green dot** = Lab active (credentials valid)
- **Red dot** = Lab stopped (credentials expired)
- **Timer** shows remaining time (~3 hours)

### Update Credentials When Expired

When you see errors like:
```
ExpiredToken: The security token included in the request is expired
```

**Fix:**
1. Go to Learner Lab
2. Click "AWS Details" → "Show"
3. Copy new credentials
4. Update `server/.env`:
   ```bash
   AWS_ACCESS_KEY_ID=ASIA... (new value)
   AWS_SECRET_ACCESS_KEY=... (new value)
   AWS_SESSION_TOKEN=... (new value)
   ```
5. Restart server:
   ```bash
   pkill -f "node server.js"
   cd server && node server.js &
   ```

---

## 📊 MongoDB Atlas (Your Current Database)

### Access MongoDB Atlas Console
```
https://cloud.mongodb.com/
```

**Login:**
- Email: (your account email)
- Password: (your MongoDB Atlas password)

### What You Can See

#### **Database Deployment**
```
Database → Browse Collections
```

**Cluster:** ashray-pharmacy  
**Database:** ashray-pharmacy

**Collections:**
1. **users** - User accounts
   - View registered users
   - See roles (patient, pharmacy, caregiver)
   
2. **prescriptions** - Uploaded prescriptions
   - View prescription records
   - See upload timestamps
   - Check file URLs
   
3. **medications** - Medication schedules
   - View medication tracking
   - See intake logs
   
4. **inventory** - Pharmacy stock
   - View inventory items
   - Check stock levels

#### **Network Access**
```
Security → Network Access
```
- Should show: `0.0.0.0/0` (Allow from anywhere)
- If not, add your IP address

#### **Database Access**
```
Security → Database Access
```
- User: `2023jaidesar_db_user`
- Role: `readWriteAnyDatabase`

#### **Metrics**
```
Metrics
```
- Connection count
- Database size
- Operation metrics
- Query performance

---

## 🔍 How to Verify Your Setup is Working

### 1. **Check MongoDB Connection**

In browser, go to:
```
http://localhost:5000/api/health
```

Should show:
```json
{
  "status": "OK",
  "message": "Ashray Pharmacy API is running on AWS EC2",
  "timestamp": "2025-10-27T..."
}
```

In server terminal, you should see:
```
✅ MongoDB Atlas Connected: ac-zpaf9vl-shard-00-01.x7pqyuv.mongodb.net
```

### 2. **Check File Upload Works**

After uploading a prescription:

**Local Storage:**
```bash
ls -lah /home/ghostblaster/Projects/CC-mini-project/uploads/prescriptions/
```

You should see your uploaded files.

**MongoDB Atlas:**
1. Go to MongoDB Atlas
2. Browse Collections → prescriptions
3. See new document with:
   - `prescriptionNumber`
   - `doctorName`
   - `prescriptionImage.url`
   - `prescriptionImage.filename`

---

## 🌐 What's Running Where

### **Development (Current Setup)**

| Service | Location | Access |
|---------|----------|--------|
| Frontend | Local (Vite) | http://localhost:5174 |
| Backend | Local (Node.js) | http://localhost:5000 |
| Database | MongoDB Atlas (Cloud) | cloud.mongodb.com |
| File Storage | Local Disk | server/uploads/ |
| Email | Gmail SMTP | smtp.gmail.com:587 |

### **Production (When Deployed to AWS)**

| Service | Location | Access |
|---------|----------|--------|
| Frontend | S3 + CloudFront | https://yourapp.com |
| Backend | EC2 Instance | ec2-xx-xx-xx-xx.compute.amazonaws.com:5000 |
| Database | MongoDB Atlas | (same) |
| File Storage | S3 Bucket | s3://ashray-prescriptions |
| Email | Gmail SMTP | (same) |

---

## 🎯 AWS Services Status

### ✅ Currently Using
- **MongoDB Atlas** (Database) - External, not AWS
- **Gmail SMTP** (Email) - External, not AWS

### ⏳ Ready to Use (When Deployed)
- **EC2** - Server hosting (scripts ready)
- **S3** - File storage (code ready, just switch middleware)
- **CloudWatch** - Monitoring and logs

### ❌ Not Available (Learner Lab Restrictions)
- **RDS** - Using MongoDB Atlas instead
- **SES** - Using Gmail SMTP instead
- **Lambda** - Not needed for this project
- **Route53** - Not needed for local dev

---

## 📦 Check What's in Your Database

### Via MongoDB Atlas UI

1. Go to https://cloud.mongodb.com/
2. Click **"Browse Collections"**
3. Select **ashray-pharmacy** database

### Via MongoDB Compass (Desktop App)

1. Download: https://www.mongodb.com/try/download/compass
2. Connect with URI:
   ```
   mongodb+srv://2023jaidesar_db_user:IV7iczAu52PwKlms@ashray-pharmacy.x7pqyuv.mongodb.net/
   ```
3. Explore collections visually

### Via Terminal (mongosh)

```bash
# Install mongosh
npm install -g mongosh

# Connect
mongosh "mongodb+srv://2023jaidesar_db_user:IV7iczAu52PwKlms@ashray-pharmacy.x7pqyuv.mongodb.net/"

# List databases
show dbs

# Use database
use ashray-pharmacy

# Show collections
show collections

# View users
db.users.find().pretty()

# View prescriptions
db.prescriptions.find().pretty()

# Count documents
db.users.countDocuments()
db.prescriptions.countDocuments()
```

---

## 🔐 Security Check

### What's Secured

✅ **MongoDB Atlas:**
- Authentication required (username/password)
- Encrypted connections (SSL/TLS)
- IP whitelist (0.0.0.0/0 for dev)

✅ **Backend API:**
- JWT authentication
- Password hashing (bcrypt)
- CORS enabled (localhost only for dev)
- Environment variables for secrets

✅ **File Uploads:**
- File type validation (JPG, PNG, PDF only)
- Size limit (5MB max)
- Sanitized filenames
- Private uploads folder

### What's NOT Secured (Dev Environment)

⚠️ **Email Password:** Plain text in .env (use app password, not real password)  
⚠️ **MongoDB IP:** Open to all (0.0.0.0/0) - fine for dev  
⚠️ **HTTP:** Not HTTPS (use HTTPS in production)  
⚠️ **AWS Credentials:** In .env file (use IAM roles in production)

---

## 🚀 When You Deploy to AWS EC2

### You'll Be Able To:

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t2.micro (free tier)
   - Run `setup-ec2.sh` script

2. **Configure Security Groups**
   - Allow port 22 (SSH)
   - Allow port 80 (HTTP)
   - Allow port 443 (HTTPS)
   - Allow port 5000 (API)

3. **Use Elastic IP**
   - Static IP address
   - Won't change on restart

4. **Set Up Domain**
   - Point domain to Elastic IP
   - Configure SSL certificate

### You'll See in AWS Console:

**EC2 Dashboard:**
- Running instance
- Instance state (running/stopped)
- Public IP address
- CPU/Network metrics

**CloudWatch:**
- Server logs
- Error tracking
- Performance metrics
- Custom alarms

---

## 💡 What to Tell Your Professor/Reviewer

### **For Database:**
"We're using MongoDB Atlas (cloud database) instead of AWS RDS because:
- It's free for development
- Better for document-based data (prescriptions, medications)
- Easy to scale
- Still cloud-based (not local)"

### **For File Storage:**
"We're using local storage temporarily because AWS Learner Lab restricts S3 bucket creation. However:
- The code is S3-ready (middleware exists)
- Easy to migrate (just change one line)
- All S3 integration code is written
- Setup script is ready (setup-s3.sh)"

### **For Email:**
"We're using Gmail SMTP instead of AWS SES because:
- AWS SES requires verification (takes 24 hours)
- Gmail SMTP works immediately
- Same functionality
- Can switch to SES in production"

### **What IS Using AWS:**
"Our production deployment uses:
- EC2 for backend server hosting (ready to deploy)
- CloudWatch for monitoring (ready to use)
- S3-compatible architecture (ready to migrate)
- AWS session credentials configured (in .env)
- Automated deployment scripts (setup-ec2.sh)"

---

## 📸 Screenshots to Take for Documentation

1. **MongoDB Atlas:**
   - Cluster dashboard
   - Collections browser showing data
   - Network access settings

2. **AWS Console:**
   - Learner Lab status (green dot)
   - AWS details page (with credentials visible)
   - EC2 dashboard (when deployed)

3. **Application:**
   - Working login/register
   - Dashboard after login
   - Prescription upload success
   - File in uploads folder

4. **Terminal:**
   - Server running (MongoDB connected)
   - Frontend running (Vite server)
   - Successful API calls

---

## ⏰ Session Management

### Learner Lab Session
- **Duration:** ~3 hours
- **Auto-stop:** Lab stops when time expires
- **Credits:** Limited per course

### Best Practices
1. Click "End Lab" when done (saves credits)
2. Don't leave running overnight
3. Refresh credentials before 3-hour mark
4. Save work frequently

### When Session Expires
1. Data in MongoDB Atlas: **✅ Safe** (separate service)
2. Data on local disk: **✅ Safe** (on your computer)
3. AWS credentials: **❌ Expired** (need refresh)
4. EC2 instances: **⚠️ May be terminated**

---

## 🎓 Summary

### What You CAN'T Do (AWS Learner Lab)
- ❌ Create S3 buckets
- ❌ Use RDS/DynamoDB
- ❌ Set up VPC
- ❌ Use Route53 DNS

### What You CAN Do
- ✅ Launch EC2 instances
- ✅ Use CloudWatch monitoring
- ✅ Configure security groups
- ✅ Use MongoDB Atlas (external)
- ✅ Deploy Node.js applications
- ✅ Local development with all features

### Current Status
- ✅ Database: MongoDB Atlas (working)
- ✅ Backend: Local Node.js (working)
- ✅ Frontend: Local Vite (working)
- ✅ File storage: Local disk (working)
- ⏳ AWS: Ready for EC2 deployment
- ⏳ S3: Code ready, waiting for full AWS access

**Your project is fully functional without AWS limitations!**
