# 🚀 Quick Start Setup Guide

This guide will help you set up the Family Document Cloud Manager from scratch.

## ⏱️ Estimated Time: 30-45 minutes

## Step-by-Step Setup

### 1️⃣ Install Dependencies (5 minutes)

```bash
# Navigate to project directory
cd Fam_Doc

# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

### 2️⃣ Firebase Project Setup (10 minutes)

#### Create Firebase Project
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `family-doc-manager` (or your choice)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

#### Enable Authentication
1. In Firebase Console, go to **Build → Authentication**
2. Click **"Get started"**
3. Click on **"Email/Password"** provider
4. Enable the toggle switch
5. Click **"Save"**

#### Create Firestore Database
1. Go to **Build → Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose your location (closest to your users)
5. Click **"Enable"**

#### Upgrade to Blaze Plan (for Cloud Functions)
1. Go to **Project Settings → Usage and billing**
2. Click **"Modify plan"**
3. Select **"Blaze (Pay as you go)"**
4. Add payment method
   - **Note**: Free tier includes 2M function invocations/month
   - You likely won't exceed free limits for family use

#### Get Firebase Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click **Web icon** (</>) to add web app
4. Register app nickname: `family-doc-web`
5. Copy the `firebaseConfig` object values

### 3️⃣ Configure Environment Variables (5 minutes)

Create `.env` file in project root:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Edit .env file with your Firebase config
```

Update `.env` with your Firebase values:
```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4️⃣ Google Drive API Setup (15 minutes)

#### Enable Google Drive API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project from dropdown
3. Navigate to **APIs & Services → Library**
4. Search for **"Google Drive API"**
5. Click on it and click **"Enable"**

#### Create Service Account
1. Go to **APIs & Services → Credentials**
2. Click **"Create Credentials"** → **"Service Account"**
3. Fill in details:
   - **Service account name**: `family-docs-drive`
   - **Service account ID**: Auto-generated
4. Click **"Create and Continue"**
5. **Grant role**: Select **"Editor"**
6. Click **"Continue"** then **"Done"**

#### Generate Service Account Key
1. Click on the service account you just created
2. Go to **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Select **"JSON"** format
5. Click **"Create"**
6. **Save the downloaded JSON file securely** (never commit to git!)

#### Configure Firebase Functions with Service Account

**Option 1: Using Firebase CLI (Development)**
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting (optional)

# Extract values from service account JSON
# Set in Functions config:
firebase functions:config:set google.client_email="YOUR_SERVICE_ACCOUNT_EMAIL"
firebase functions:config:set google.private_key="YOUR_PRIVATE_KEY"
```

**Option 2: Using Environment Secrets (Production - Recommended)**
```bash
# Store the entire service account JSON
firebase functions:secrets:set GOOGLE_SERVICE_ACCOUNT < path/to/service-account.json
```

### 5️⃣ Deploy Firestore Rules & Indexes (3 minutes)

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### 6️⃣ Test Locally (2 minutes)

```bash
# Start development server
npm run dev
```

Visit http://localhost:3000 and:
1. Click **"Create Account"**
2. Register with email and password
3. You'll be redirected to dashboard

### 7️⃣ Set First User as Admin (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database**
3. Click on **"users"** collection
4. Find your user document (by email)
5. Click on the document
6. Edit the `role` field
7. Change value from `"member"` to `"admin"`
8. Click **"Update"**
9. Refresh your app - you now have admin access!

### 8️⃣ Deploy Cloud Functions (5 minutes)

```bash
# Deploy all functions
firebase deploy --only functions

# Wait for deployment to complete
# Note: First deployment may take 3-5 minutes
```

### 9️⃣ Deploy Frontend to Production (5 minutes)

#### Option A: Vercel (Recommended - Easiest)
```bash
# Install Vercel CLI
npm install -g vercel

# Build the app
npm run build

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? family-doc-manager
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

#### Option B: Firebase Hosting
```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Your app will be live at:
# https://your-project.web.app
```

### 🎉 You're Done!

Your Family Document Manager is now live!

## 📱 First Upload Test

1. Log in to your app
2. Click **"Upload"** in navbar
3. Select a test image or PDF
4. Fill in:
   - Title: "Test Document"
   - Type: Select any type
   - Tags: Add "test"
5. Click **"Save Document"**
6. Check if it appears in Dashboard
7. Click to view it

If successful, you're all set! 🚀

## 🔍 Troubleshooting

### Issue: "Permission denied" when uploading
**Solution**: 
- Verify Google Drive API is enabled
- Check service account credentials in Functions config
- Run: `firebase functions:config:get`

### Issue: Functions not deploying
**Solution**:
- Ensure Blaze plan is active
- Check `functions/package.json` exists
- Run: `cd functions && npm install`

### Issue: Documents not showing in Dashboard
**Solution**:
- Check Firestore rules are deployed
- Verify user role in Firestore
- Check browser console for errors

### Issue: Images not displaying
**Solution**:
- Verify files uploaded to Google Drive
- Check Drive permissions (should be "anyone with link")
- Look at Cloud Functions logs: `firebase functions:log`

## 📊 Verify Everything Works

- [ ] User registration works
- [ ] Login/logout works
- [ ] Can upload documents
- [ ] Files appear in Google Drive
- [ ] Documents show in Dashboard
- [ ] Can view document preview
- [ ] Can edit metadata
- [ ] Can delete (move to trash)
- [ ] Can restore from trash
- [ ] Search and filters work

## 🔐 Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Service account JSON is not in git
- [ ] Firestore rules are deployed
- [ ] Only authenticated users can access app
- [ ] Admin user is set up correctly

## 📈 Next Steps

1. **Invite family members**: Share the app URL
2. **Create user accounts**: Register each family member
3. **Set roles**: Assign admin/member/viewer roles in Firestore
4. **Organize documents**: Create consistent tagging strategy
5. **Backup**: Export Firestore data regularly

## 💡 Pro Tips

- Use descriptive document titles
- Add relevant tags for easy searching
- Organize by document type
- Set up regular document reviews
- Monitor Google Drive storage usage
- Keep service account credentials secure

## 🆘 Need Help?

1. Check Firebase Console logs
2. Review Cloud Functions logs: `firebase functions:log`
3. Check browser console (F12)
4. Verify all environment variables
5. Test with Firebase Emulators first

---

**Estimated Costs (Monthly)**
- Firebase (Firestore + Auth): **FREE** (within limits)
- Cloud Functions: **FREE** (2M invocations/month)
- Google Drive: **FREE** (15GB per account)
- Vercel Hosting: **FREE** (Hobby plan)

**Total: $0** for typical family use! 🎉
