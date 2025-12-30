# Google Drive Multi-Account Setup

## Setup Steps:

### 1. Create Google Cloud Project
1. Go to: https://console.cloud.google.com/
2. Create new project: "Family-Doc-Manager"
3. Enable Google Drive API

### 2. Create OAuth Credentials
1. Go to: APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "Family Doc Manager"
5. Authorized JavaScript origins:
   - http://localhost:3000
   - http://localhost:5173
   - Your production URL
6. Copy the Client ID

### 3. Add to .env
```env
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

### 4. How It Works
- User signs in with their Google account
- Files upload to THEIR Google Drive (15GB free)
- Files are automatically shared with family members
- Everyone can view via the app using public links
- No server costs, no Blaze plan needed!

### 5. Sharing Strategy
**Option 1: Public Links (Current)**
- Files set to "Anyone with link can view"
- Family members access via app
- No Google account needed to view
- Most flexible

**Option 2: Email Sharing (Optional)**
- Share with specific family member emails
- More secure
- Requires family members to have Google accounts

### Benefits:
✅ FREE - No Firebase Blaze plan needed
✅ 15GB per Google account
✅ Direct upload from browser
✅ Files stored in user's own Drive
✅ No server storage costs
