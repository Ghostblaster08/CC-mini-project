# 🔍 DEBUGGING GUIDE - Dashboard Not Showing

## Problem
After logging in, you're stuck on the login page and can't see the dashboard.

---

## ✅ Step-by-Step Debugging Process

### **Step 1: Open Browser Console**
1. Open http://localhost:5174 in Chrome/Firefox
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Keep it open while you login

### **Step 2: Try Logging In Again**
1. Go to http://localhost:5174/login
2. Enter your credentials
3. Click "Login"
4. **Watch the console for messages**

You should see:
```
🔐 Attempting login with: your@email.com
📡 AuthContext: Sending login request...
📡 AuthContext: Login response: { data: {...}, token: "..." }
💾 Saving to localStorage - Token: exists
💾 Saving to localStorage - User: { name: "...", email: "...", role: "patient" }
✅ AuthContext: User state updated
✅ Login successful! User: { name: "...", ... }
📍 User role: patient
👤 Navigating to patient dashboard
```

### **Step 3: Check What You See**

#### ✅ **If you see those messages:**
The login is working! The issue is navigation.

**Check:**
1. Did the URL change to `/dashboard`?
2. Is the page blank/white?
3. Do you see any red errors in console?

#### ❌ **If you see error messages:**

**Error: "Network Error" or "Failed to fetch"**
```
Problem: Backend server is not running
Solution: Check server terminal - should show "Server running on port 5000"
```

**Error: "Cannot POST /api/auth/login" or 404**
```
Problem: API route not found
Solution: Server might be crashed - restart it
```

**Error: "Invalid credentials"**
```
Problem: Wrong email/password
Solution: Register a new account first
```

---

## 🔧 Quick Fixes

### **Fix 1: Manually Navigate to Dashboard**
After logging in, manually go to:
```
http://localhost:5174/dashboard
```

If you see the dashboard, the issue is the navigation redirect.

### **Fix 2: Check localStorage**
In browser console, type:
```javascript
localStorage.getItem('token')
localStorage.getItem('user')
```

You should see:
```
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (the token)
'{"_id":"...","name":"...","email":"...","role":"patient"}' (user data)
```

If missing, login is not saving data.

### **Fix 3: Clear Everything and Start Fresh**
In browser console:
```javascript
localStorage.clear()
```

Then:
1. Close all tabs
2. Go to http://localhost:5174
3. Click "Get Started"
4. Register a NEW account
5. After registration, check if you see dashboard

### **Fix 4: Check Network Tab**
1. Open Dev Tools (F12)
2. Click **Network** tab
3. Login again
4. Look for the request to `/api/auth/login`
5. Click on it
6. Check the **Response** tab

Should show:
```json
{
  "success": true,
  "token": "eyJ...",
  "data": {
    "_id": "...",
    "name": "Your Name",
    "email": "your@email.com",
    "role": "patient"
  }
}
```

---

## 🎯 Most Common Issues & Solutions

### Issue 1: "Stuck on white page after login"
**Cause**: Dashboard component has an error  
**Check**: Browser console for red errors  
**Fix**: See error message and fix the component

### Issue 2: "Redirects back to login immediately"
**Cause**: Token not saved or PrivateRoute blocking  
**Check**: 
```javascript
localStorage.getItem('token')  // Should have a value
```
**Fix**: Make sure login response has a token field

### Issue 3: "Nothing happens when I click Login"
**Cause**: Form submission error  
**Check**: Console for errors  
**Fix**: Make sure backend is running on port 5000

### Issue 4: "CORS error"
**Cause**: Backend not allowing frontend origin  
**Check**: Console shows "CORS policy" error  
**Fix**: Already configured in server.js (allows localhost:5174)

---

## 🧪 Test Each Component Separately

### Test 1: Backend is Running
Open in browser:
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

### Test 2: Registration Works
```
http://localhost:5174/register
```
Create a test account:
- Name: Test User
- Email: test@example.com
- Password: test123
- Role: Patient

After clicking Register:
- Should show "Registration successful!"
- Should redirect to dashboard automatically

### Test 3: Dashboard Loads Directly
If you have a token, try going directly to:
```
http://localhost:5174/dashboard
```

If it loads, the issue is ONLY the redirect after login.

---

## 🔍 Advanced Debugging

### Check React Router
In browser console:
```javascript
// Check if window.location changed
window.location.href
// Should be "http://localhost:5174/dashboard" after login
```

### Check Auth State
Add this to Dashboard.jsx at the top of the component:
```javascript
const { user } = useAuth();
console.log('Dashboard loaded! User:', user);
```

### Enable Detailed Logging
Already added logging to:
- ✅ Login.jsx (shows login process)
- ✅ AuthContext.jsx (shows auth state changes)

---

## 📱 What You Should See in Console

### **During Login:**
```
🔐 Attempting login with: test@example.com
📡 AuthContext: Sending login request...
📡 AuthContext: Login response: {success: true, token: "...", data: {...}}
💾 Saving to localStorage - Token: exists
💾 Saving to localStorage - User: {_id: "...", name: "Test User", ...}
✅ AuthContext: User state updated
✅ Login successful! User: {name: "Test User", email: "test@example.com", role: "patient"}
📍 User role: patient
👤 Navigating to patient dashboard
```

### **When Dashboard Loads:**
```
Dashboard loaded! User: {name: "Test User", email: "test@example.com", role: "patient"}
```

---

## ⚡ Emergency Reset

If nothing works:

### 1. Kill All Servers
```bash
pkill -f "node server.js"
pkill -f "vite"
```

### 2. Clear Browser Data
- Press Ctrl+Shift+Delete
- Clear "Cookies and site data"
- Clear "Cached images and files"
- Time range: "Last hour"

### 3. Restart Everything
```bash
# Terminal 1: Start backend
cd /home/ghostblaster/Projects/CC-mini-project/server
node server.js

# Terminal 2: Start frontend
cd /home/ghostblaster/Projects/CC-mini-project/client
npm run dev
```

### 4. Fresh Start
1. Go to http://localhost:5174
2. Register brand new account
3. Should auto-redirect to dashboard

---

## 📞 Report Back With This Info

If still not working, provide:

1. **Console Output** (copy all messages)
2. **Network Tab** (screenshot of /api/auth/login response)
3. **Current URL** (after clicking login)
4. **localStorage contents**:
   ```javascript
   {
     token: localStorage.getItem('token'),
     user: localStorage.getItem('user')
   }
   ```

---

## 🎯 Expected Behavior

### **Successful Login Flow:**
1. Enter credentials → Click "Login"
2. See "Login successful!" toast message
3. URL changes to `/dashboard`
4. See dashboard with:
   - "Welcome back, [Your Name]!" message
   - Active Medications card
   - Adherence Rate card
   - Total Prescriptions card
   - AWS Integration Status
   - Upload Prescription button
5. Navbar appears at top with theme toggle

**Total time: 1-2 seconds**
