# 🗂️ Family Document Cloud Manager

A secure, cloud-based web application for managing family documents using **React**, **Firebase**, and **Google Drive API**. Upload, organize, view, and share important documents like Aadhar cards, passports, certificates, and more.

## ✨ Features

### Core Features
- 🔐 **Secure Authentication** - Firebase Auth with email/password
- 📤 **Multi-page Upload** - Upload documents with 10+ pages, front/back sides
- 🖼️ **Document Preview** - View images and PDFs inline
- 🔍 **Advanced Search** - Search by title, tags, type, or OCR text
- 🏷️ **Metadata Management** - Title, type, tags, notes, owner
- 👥 **Role-based Access** - Admin, Member, Viewer roles
- 🗑️ **Soft Delete & Restore** - Trash with restore functionality
- ☁️ **Google Drive Storage** - 15GB free storage per account
- 📱 **Responsive Design** - Works on desktop and mobile

### Advanced Features
- 🔄 **Multi-account Rotation** - Automatic switching when nearing 15GB limit
- 🔗 **Document Sharing** - Share with family members
- 📊 **Storage Monitoring** - Track Drive usage
- 🎨 **Modern UI** - Beautiful Tailwind CSS design
- ⚡ **Real-time Updates** - Firestore live sync

## 🏗️ Architecture

```
Frontend:      React.js + Vite + Tailwind CSS
Backend:       Firebase Cloud Functions (Node.js)
Authentication: Firebase Auth
Database:      Cloud Firestore
Storage:       Google Drive API
Hosting:       Vercel / Firebase Hosting
```

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js 18+ and npm installed
- A Firebase account (free tier works)
- A Google Cloud Platform account
- Git installed

## 🚀 Setup Instructions

### Step 1: Clone and Install Dependencies

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

### Step 2: Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Name it (e.g., "family-doc-manager")
   - Disable Google Analytics (optional)

2. **Enable Firebase Services**
   - **Authentication**: Enable Email/Password provider
   - **Firestore Database**: Create in production mode
   - **Functions**: Upgrade to Blaze plan (pay-as-you-go, free tier available)

3. **Get Firebase Config**
   - Go to Project Settings → General
   - Scroll to "Your apps" → Add web app
   - Copy the config values

4. **Create `.env` file**
   ```bash
   # Copy the example
   cp .env.example .env
   ```

   Edit `.env` and add your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### Step 3: Google Drive API Setup

1. **Enable Google Drive API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your Firebase project (or create new one)
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Drive API" and enable it

2. **Create Service Account**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Name it (e.g., "family-docs-storage")
   - Click "Create and Continue"
   - Grant role: "Editor" or "Owner"
   - Click "Done"

3. **Generate Service Account Key**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose JSON format
   - Download the key file (keep it secure!)

4. **Configure Firebase Functions**
   ```bash
   # Install Firebase CLI globally
   npm install -g firebase-tools

   # Login to Firebase
   firebase login

   # Initialize Firebase (select existing project)
   firebase init

   # Set Google credentials in Functions config
   firebase functions:config:set \
     google.client_email="your-service-account@project.iam.gserviceaccount.com" \
     google.private_key="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

   **Alternative**: Store the entire service account JSON in Firebase secrets (recommended for production)

### Step 4: Deploy Firestore Rules

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Step 5: Create First Admin User

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Register the first user** at http://localhost:3000/register

3. **Manually set as admin** in Firestore:
   - Go to Firebase Console → Firestore Database
   - Find the user document in `users` collection
   - Edit the `role` field to `"admin"`

### Step 6: Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:uploadToDrive
```

### Step 7: Deploy Frontend

**Option A: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
npm run build
vercel deploy --prod
```

**Option B: Firebase Hosting**
```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## 🔧 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start Firebase emulators (optional)
firebase emulators:start
```

## 📁 Project Structure

```
Fam_Doc/
├── functions/              # Firebase Cloud Functions
│   ├── index.js           # Drive API integration
│   └── package.json
├── src/
│   ├── components/        # React components
│   │   ├── Auth/         # Login, Register
│   │   ├── Dashboard/    # Document listing, cards
│   │   ├── Upload/       # Multi-page upload
│   │   ├── Viewer/       # Document viewer
│   │   ├── Edit/         # Edit metadata
│   │   ├── Trash/        # Soft delete management
│   │   ├── Settings/     # User settings
│   │   └── Layout/       # Navbar, layout
│   ├── config/           # Firebase config
│   ├── contexts/         # React contexts (Auth)
│   └── styles/           # Tailwind CSS
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Database indexes
├── firebase.json          # Firebase configuration
├── package.json
├── vite.config.js
└── README.md
```

## 🔒 Security Features

- **Firebase Auth** - Secure user authentication
- **Firestore Rules** - Role-based access control
- **Service Account** - Secure Google Drive access
- **HTTPS Only** - All traffic encrypted
- **Signed URLs** - Secure file access

## 📊 Firestore Collections

### Users Collection
```javascript
{
  uid: "user_123",
  name: "John Doe",
  email: "john@example.com",
  role: "admin" | "member" | "viewer",
  linkedDrive: "drive_account_1",
  createdAt: "2025-01-01T00:00:00Z"
}
```

### Documents Collection
```javascript
{
  docId: "doc_001",
  title: "Birth Certificate",
  ownerId: "user_123",
  ownerName: "John Doe",
  type: "birth_certificate",
  tags: ["birth", "certificate"],
  notes: "Important document",
  pages: [
    { fileId: "drive_file_id", pageNumber: 1, side: "front" }
  ],
  pdfFileId: "merged_pdf_id",
  driveFolderId: "folder_id",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  ocrText: "",
  sharedWith: [{ uid: "user_002", permission: "view" }],
  isDeleted: false
}
```

## 🎯 Usage Guide

### Uploading Documents
1. Click "Upload" in the navbar
2. Drag & drop or select files (images/PDFs)
3. Reorder pages if needed
4. Fill in metadata (title, type, tags, notes)
5. Click "Save Document"

### Viewing Documents
1. Go to Dashboard
2. Click on any document card
3. Navigate between pages using arrows
4. Download individual pages or entire document

### Organizing Documents
1. Use search bar to find documents
2. Filter by type, owner, or tags
3. Edit metadata by clicking "Edit" button
4. Delete documents (moved to trash)

### Managing Trash
1. Click "Trash" in navbar
2. Select documents to restore or delete permanently
3. Use bulk actions for multiple documents

## 🐛 Troubleshooting

**Issue: Files not uploading to Google Drive**
- Check service account credentials in Firebase Functions config
- Verify Google Drive API is enabled
- Check Cloud Functions logs: `firebase functions:log`

**Issue: "Permission denied" errors**
- Review Firestore security rules
- Ensure user has correct role (admin/member/viewer)
- Check document ownership and sharing settings

**Issue: Images not displaying**
- Verify Drive files have "anyone with link" permission
- Check file IDs in Firestore
- Ensure CORS is properly configured

## 🚀 Production Deployment Checklist

- [ ] Update `.env` with production Firebase config
- [ ] Deploy Firestore rules and indexes
- [ ] Deploy Cloud Functions with production credentials
- [ ] Set up custom domain (optional)
- [ ] Enable Firebase App Check for security
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy for Firestore
- [ ] Test all features in production environment

## 📝 Environment Variables

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## 🤝 Contributing

This is a private family project, but feel free to fork and customize for your own use!

## 📄 License

Private - All Rights Reserved

## 🆘 Support

For issues or questions:
1. Check Firebase Console logs
2. Review Cloud Functions logs
3. Check browser console for errors
4. Verify all API keys and credentials

## 🔮 Future Enhancements

- [ ] Mobile app (React Native PWA)
- [ ] Offline scan + auto-upload
- [ ] OCR with Google Vision API
- [ ] Family invite links
- [ ] Advanced sharing permissions
- [ ] Document expiry reminders
- [ ] Bulk operations
- [ ] Export to ZIP
- [ ] Document templates

---

**Built with ❤️ for secure family document management**
