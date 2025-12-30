# ⚡ Quick Start Checklist

Copy this checklist and check off items as you complete them!

## 📦 Installation (5 min)
- [ ] Run `npm install` in project root
- [ ] Run `cd functions && npm install && cd ..`

## 🔥 Firebase Setup (15 min)
- [ ] Create Firebase project at console.firebase.google.com
- [ ] Enable Email/Password authentication
- [ ] Create Firestore database (production mode)
- [ ] Upgrade to Blaze plan (free tier available)
- [ ] Copy Firebase config values

## 🔧 Environment Setup (5 min)
- [ ] Copy `.env.example` to `.env`
- [ ] Paste Firebase config in `.env` file
- [ ] Save the file

## 🚗 Google Drive API (15 min)
- [ ] Go to console.cloud.google.com
- [ ] Enable Google Drive API
- [ ] Create Service Account
- [ ] Download service account JSON key
- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login: `firebase login`
- [ ] Configure Functions with service account credentials

## 🛡️ Deploy Security (3 min)
- [ ] Run `firebase deploy --only firestore:rules`
- [ ] Run `firebase deploy --only firestore:indexes`

## 🧪 Test Locally (5 min)
- [ ] Run `npm run dev`
- [ ] Visit http://localhost:3000
- [ ] Create first account
- [ ] Verify registration works

## 👑 Set Admin (2 min)
- [ ] Go to Firebase Console → Firestore
- [ ] Find your user in `users` collection
- [ ] Change `role` field to `"admin"`
- [ ] Refresh app to see admin access

## ☁️ Deploy Backend (5 min)
- [ ] Run `firebase deploy --only functions`
- [ ] Wait for deployment (3-5 min)
- [ ] Verify functions are live in Firebase Console

## 🚀 Deploy Frontend (5 min)
**Choose one:**

### Option A: Vercel
- [ ] Run `npm install -g vercel`
- [ ] Run `npm run build`
- [ ] Run `vercel --prod`

### Option B: Firebase Hosting
- [ ] Run `npm run build`
- [ ] Run `firebase deploy --only hosting`

## ✅ Final Testing (10 min)
- [ ] Register second test user
- [ ] Upload a test document (image or PDF)
- [ ] Verify file appears in Google Drive
- [ ] Check document shows in Dashboard
- [ ] Test document viewer
- [ ] Test edit metadata
- [ ] Test delete and restore
- [ ] Test search and filters

## 🎉 Success Criteria
- [ ] Users can register and login
- [ ] Documents upload successfully
- [ ] Files stored in Google Drive
- [ ] Documents display correctly
- [ ] All CRUD operations work
- [ ] Search and filters functional
- [ ] Role-based permissions work

## 📊 Estimated Time: 45-60 minutes total

---

## 🆘 If Something Goes Wrong

### Can't upload files?
→ Check Cloud Functions logs: `firebase functions:log`

### Permission errors?
→ Verify Firestore rules deployed

### Images not showing?
→ Check Google Drive file permissions

### Functions not deploying?
→ Ensure Blaze plan is active

---

## 📞 Support Resources
- `README.md` - Full documentation
- `SETUP_GUIDE.md` - Detailed setup steps
- `PROJECT_SUMMARY.md` - What's been built
- Firebase Console - Check logs and data
- Browser Console (F12) - Check for errors

---

**Once all items are checked ✓, your app is production-ready! 🚀**
