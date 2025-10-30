# 🧪 AWS Cognito Testing Guide

## ⚠️ IMPORTANT: Before Testing

### 1. Fix Callback URL in AWS Console (CRITICAL)

Your Cognito User Pool has an **incorrect callback URL**:

**Current (WRONG):** `https://http://localhost:5173/dashboard`

**Should be:** `http://localhost:5173`

#### Steps to Fix:
1. Go to **AWS Console** → **Cognito** → **User Pools**
2. Select User Pool: `us-east-1_yzRgiNZZ0`
3. Click **"App integration"** tab
4. Find App Client: `2sri49rr36h5ms0eanec000jcn`
5. Click **"Edit"** under "Hosted UI settings"
6. Update **Callback URL(s):**
   ```
   http://localhost:5173
   ```
7. Update **Sign-out URL(s):**
   ```
   http://localhost:5173/login
   ```
8. Click **"Save changes"**

---

## 🚀 Starting the Application

### Terminal 1: Backend Server
```bash
cd /home/ghostblaster/Projects/CC-mini-project/server
npm run dev
```

**Expected output:**
```
🚀 Server running on port 5000
✅ MongoDB connected successfully
```

### Terminal 2: Frontend Dev Server
```bash
cd /home/ghostblaster/Projects/CC-mini-project/client
npm run dev
```

**Expected output:**
```
  VITE v7.1.12  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🧪 Test Case 1: User Registration with Cognito

### Steps:
1. Open browser: `http://localhost:5173`
2. Click **"Get Started"** or **"Register"**
3. Fill in registration form:
   - **Name:** Test User
   - **Email:** testuser@example.com (use real email you can access)
   - **Password:** `TestPass123!` (must meet Cognito requirements)
   - **Confirm Password:** `TestPass123!`
   - **Role:** Patient
   - **Phone:** +1234567890 (optional)
4. Click **"Register"**

### Expected Results:
✅ Backend logs:
```
📝 Registration request received: { name: 'Test User', email: 'testuser@example.com', ... }
🔐 Registering user in Cognito...
✅ Creating user profile in MongoDB: testuser@example.com
✅ User registered successfully: 67abc123def...
```

✅ Frontend:
- Toast message: "Registration successful! Please check your email for verification code."
- Redirect to: `/verify-email`

✅ Email:
- Check inbox for AWS Cognito verification email
- Subject: "Your verification code"
- Body contains 6-digit code (e.g., `123456`)

### Troubleshooting:
❌ **Error: "Password does not meet requirements"**
- Ensure password has:
  - Minimum 8 characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*)
- Example valid password: `SecurePass123!`

❌ **Error: "User already exists"**
- Email already registered in Cognito
- Use different email or delete user from Cognito console

❌ **Error: "Invalid parameter: Value at 'password' failed to satisfy constraint"**
- Password doesn't meet Cognito policy
- Check backend logs for specific requirements

---

## 🧪 Test Case 2: Email Verification

### Steps:
1. On verification page (`/verify-email`)
2. Email should be pre-filled from registration
3. Enter the 6-digit code from email
4. Click **"Verify Email"**

### Expected Results:
✅ Backend logs:
```
✅ Email verified: testuser@example.com
```

✅ Frontend:
- Toast message: "Email verified successfully. You can now log in."
- Redirect to: `/login` after 2 seconds

✅ Database:
- User document updated: `emailVerified: true`

### Troubleshooting:
❌ **Error: "Invalid verification code"**
- Code is incorrect
- Try clicking "Resend Code" for new code

❌ **Error: "Verification code has expired"**
- Code expired (typically 24 hours)
- Click "Resend Code" button
- Check email for new code

❌ **Didn't receive email?**
- Check spam/junk folder
- Check AWS Cognito console → User Pools → Messages
- Verify email address is correct
- Click "Resend Code"

---

## 🧪 Test Case 3: User Login with Cognito

### Steps:
1. Go to login page: `http://localhost:5173/login`
2. Enter credentials:
   - **Email:** testuser@example.com
   - **Password:** `TestPass123!`
3. Click **"Login"**

### Expected Results:
✅ Backend logs:
```
🔐 Login request received: testuser@example.com
🔐 Authenticating with Cognito...
✅ Login successful: testuser@example.com
```

✅ Frontend:
- Toast message: "Login successful"
- Redirect to: `/dashboard`
- Navbar shows user name and role

✅ localStorage:
```javascript
localStorage.getItem('idToken')      // "eyJraWQiOiJ..."
localStorage.getItem('accessToken')  // "eyJraWQiOiJ..."
localStorage.getItem('refreshToken') // "eyJjdHkiOiJ..."
localStorage.getItem('user')         // {"_id":"...","name":"Test User","email":"testuser@example.com","role":"patient"}
```

### Troubleshooting:
❌ **Error: "Please verify your email address first"**
- Email not verified yet
- Complete Test Case 2 first

❌ **Error: "Invalid email or password"**
- Credentials incorrect
- Double-check email and password
- Password is case-sensitive

❌ **Error: "User profile not found"**
- User exists in Cognito but not MongoDB
- Check backend logs for MongoDB errors
- Verify MongoDB connection

---

## 🧪 Test Case 4: Protected Routes

### Steps:
1. After login, navigate to: `/dashboard`
2. Check that page loads correctly
3. Open browser console (F12)
4. Check Network tab for API requests

### Expected Results:
✅ Network requests include Authorization header:
```
Authorization: Bearer eyJraWQiOiJhbc123...
```

✅ Backend logs (for API request):
```
✅ Token verified for user: testuser@example.com
✅ Role check passed for testuser@example.com (patient)
```

✅ API responses include user data:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "patient"
  }
}
```

### Troubleshooting:
❌ **401 Unauthorized error**
- Token expired (default: 1 hour)
- Token invalid or tampered
- Clear localStorage and login again

❌ **Token verification failed**
- Check backend logs for specific error
- Verify AWS_COGNITO_USER_POOL_ID is correct
- Verify AWS_COGNITO_CLIENT_ID is correct
- Check internet connection (backend downloads JWKS)

---

## 🧪 Test Case 5: Token Verification Middleware

### Steps:
1. Login successfully
2. Make API request to `/api/auth/me`
3. Check response includes Cognito data

### Test with curl:
```bash
# Replace <ID_TOKEN> with actual token from localStorage
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json"
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "_id": "67abc123...",
    "cognitoUserId": "us-east-1:xyz-abc-123",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "patient",
    "cognitoData": {
      "userId": "us-east-1:xyz-abc-123",
      "email": "testuser@example.com",
      "name": "Test User",
      "role": "patient",
      "emailVerified": true
    }
  }
}
```

### Backend logs:
```
✅ Token verified for user: testuser@example.com
```

---

## 🧪 Test Case 6: Prescription Upload (S3 + Cognito)

### Steps:
1. Login as patient
2. Navigate to: `/prescriptions` or "Upload Prescription"
3. Fill in form:
   - Medication Name
   - Dosage
   - Frequency
4. Upload PDF file
5. Click "Upload"

### Expected Results:
✅ Backend logs:
```
✅ Token verified for user: testuser@example.com
📤 Uploading to S3: prescriptions/67abc123_prescription_1234567890.pdf
✅ S3 upload successful: https://cc-mp-batman.s3.amazonaws.com/prescriptions/...
💾 Saving prescription to database
✅ Prescription saved with S3 URL
```

✅ Database:
- Prescription document created
- `uploadedBy` field contains user ID
- `fileUrl` contains S3 URL

✅ S3 Bucket:
- File uploaded to `cc-mp-batman/prescriptions/`
- File accessible at returned URL

---

## 🧪 Test Case 7: Logout

### Steps:
1. While logged in, click "Logout" in navbar
2. Check redirect behavior
3. Check localStorage

### Expected Results:
✅ Backend logs:
```
✅ User logged out: testuser@example.com
```

✅ Frontend:
- Redirect to: `/login` or `/`
- localStorage cleared:
  ```javascript
  localStorage.getItem('idToken')      // null
  localStorage.getItem('accessToken')  // null
  localStorage.getItem('refreshToken') // null
  localStorage.getItem('user')         // null
  ```

✅ Cognito:
- User session invalidated
- Cannot use old tokens

### Test Logout:
```bash
# Attempt to use old token after logout (should fail)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <OLD_ID_TOKEN>"
```

Expected: `401 Unauthorized` or `Token has expired`

---

## 🧪 Test Case 8: Password Reset Flow

### Steps:
1. Go to login page
2. Click "Forgot Password?"
3. Enter email address
4. Click "Send Reset Code"
5. Check email for reset code
6. Enter code and new password
7. Click "Reset Password"
8. Login with new password

### Expected Results:
✅ Backend logs:
```
✅ Password reset code sent: testuser@example.com
✅ Password reset successful: testuser@example.com
```

✅ Email:
- Subject: "Your password reset code"
- Body contains 6-digit code

✅ Login works with new password

---

## 📊 Verification Checklist

### Backend ✅
- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] Cognito service initialized
- [ ] JWT middleware configured
- [ ] Auth routes respond correctly
- [ ] User registration creates Cognito + MongoDB records
- [ ] Login returns Cognito tokens
- [ ] Token verification works
- [ ] Protected routes check authentication

### Frontend ✅
- [ ] App builds without errors
- [ ] Registration form validates password
- [ ] Verification page works
- [ ] Login stores tokens in localStorage
- [ ] Axios adds Authorization header
- [ ] Protected routes redirect when not authenticated
- [ ] Logout clears tokens
- [ ] Error messages display correctly

### AWS Services ✅
- [ ] Cognito User Pool exists: `us-east-1_yzRgiNZZ0`
- [ ] App Client configured: `2sri49rr36h5ms0eanec000jcn`
- [ ] Callback URLs corrected (no double protocol)
- [ ] Email verification enabled
- [ ] S3 bucket working: `cc-mp-batman`
- [ ] Backend can upload to S3

### Database ✅
- [ ] MongoDB connection works
- [ ] User model updated (no password field)
- [ ] Users have `cognitoUserId` field
- [ ] Prescriptions link to users correctly

---

## 🎯 Success Criteria

✅ **Complete Success:**
1. User can register with Cognito
2. User receives verification email
3. User can verify email with code
4. User can login with Cognito
5. Cognito ID token stored in frontend
6. Protected API routes verify token
7. User can upload prescription to S3
8. User can logout
9. User can reset password

✅ **AWS Services Working:**
- S3: Prescription uploads ✅
- Cognito: User authentication ✅
- **Total: 2 AWS services** (meets requirement)

---

## 🐛 Common Issues & Fixes

### Issue: "Token verification failed"
**Cause:** JWKS download error or invalid token
**Fix:**
1. Check internet connection
2. Verify `AWS_COGNITO_USER_POOL_ID` in server/.env
3. Verify `AWS_REGION=us-east-1` in server/.env
4. Check backend logs for specific error
5. Try logging in again for fresh token

### Issue: "User not found in MongoDB"
**Cause:** Registration failed to create MongoDB record
**Fix:**
1. Check MongoDB connection
2. Check backend logs for MongoDB errors
3. Manually create user in MongoDB:
   ```javascript
   {
     "cognitoUserId": "<from Cognito>",
     "name": "Test User",
     "email": "test@example.com",
     "role": "patient",
     "emailVerified": true,
     "isActive": true
   }
   ```

### Issue: "Password validation error"
**Cause:** Password doesn't meet Cognito requirements
**Fix:** Use password with:
- 8+ characters
- Uppercase (A-Z)
- Lowercase (a-z)
- Number (0-9)
- Special char (!@#$%^&*)

Example: `SecurePass123!`

### Issue: Verification email not received
**Fix:**
1. Check spam/junk folder
2. Verify email in Cognito console
3. Check AWS SES sandbox (if using SES)
4. Use real email address (not disposable)
5. Click "Resend Code"

---

## 📞 Need Help?

Check these resources:
1. **Backend logs** (`server` terminal)
2. **Frontend console** (F12 → Console)
3. **Network tab** (F12 → Network)
4. **AWS Cognito console** (verify user exists)
5. **MongoDB Compass** (check user records)
6. **`COGNITO_INTEGRATION_COMPLETE.md`** (implementation details)

---

## 🎉 Success Message

If all tests pass, you have successfully integrated:
- ✅ AWS Cognito for authentication
- ✅ AWS S3 for file storage
- ✅ MongoDB for user profiles
- ✅ JWT token verification
- ✅ Email verification flow
- ✅ Password reset flow

**Your project now uses 2 AWS services!** 🚀
