---
description: Deploy DocuHaven to Vercel
---

# Deploy DocuHaven to Vercel

This workflow guides you through deploying your Family Document Cloud Manager to Vercel.

## Prerequisites
- Vercel CLI installed ✅ (version 48.7.0)
- Firebase project configured
- Environment variables from `.env` file

## Step 1: Login to Vercel

First, authenticate with Vercel:

```bash
vercel login
```

This will open your browser for authentication. Follow the prompts to sign in.

## Step 2: Verify Your Environment Variables

Make sure your `.env` file has all required values:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GOOGLE_CLIENT_ID`

## Step 3: Initial Deployment

Deploy your project for the first time:

```bash
vercel
```

You'll be asked:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Select your account/team
3. **Link to existing project?** → No (for first time) or Yes (if already created)
4. **Project name?** → Press Enter to use default (docuhaven) or enter custom name
5. **Directory?** → Press Enter (current directory)
6. **Override settings?** → No

This will create a preview deployment.

## Step 4: Set Environment Variables

After initial deployment, add your environment variables:

### Option A: Using Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Select your project (docuhaven)
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Name: `VITE_FIREBASE_API_KEY`
   - Value: (paste from your .env)
   - Environment: Production, Preview, Development (check all)
5. Repeat for all 7 environment variables

### Option B: Using Vercel CLI
Set each variable individually:

```bash
# Example - repeat for each variable
vercel env add VITE_FIREBASE_API_KEY
# When prompted, paste the value and select environment (production)
```

Or use this batch command (replace values from your .env):

```bash
echo "VITE_FIREBASE_API_KEY=your_value_here" | vercel env add VITE_FIREBASE_API_KEY production
```

## Step 5: Production Deployment

After setting environment variables, deploy to production:

// turbo
```bash
vercel --prod
```

This will:
1. Build your project using `npm run build`
2. Deploy to your production URL
3. Make it live at `https://your-project.vercel.app`

## Step 6: Verify Deployment

1. Open the deployment URL (shown in terminal)
2. Test key features:
   - User registration/login
   - Document upload
   - Document viewing
   - Search functionality

## Alternative: Quick Deploy Script

You can also use the npm script defined in package.json:

```bash
npm run deploy
```

This runs `npm run build && vercel deploy --prod`

## Troubleshooting

### Environment Variables Not Working
- Make sure you redeploy after adding env vars: `vercel --prod`
- Verify variables are set in Vercel dashboard
- For Vite, variables MUST start with `VITE_`

### Build Failures
- Check Node.js version compatibility
- Run `npm run build` locally first to catch errors
- Check Vercel build logs in dashboard

### Firebase Connection Issues
- Verify all Firebase config values are correct
- Check Firebase project settings match your .env
- Ensure Firebase services (Auth, Firestore) are enabled

## Continuous Deployment

Once linked to Vercel:
1. Push to your main/master branch → Auto-deploy to production
2. Push to other branches → Auto-deploy to preview URLs
3. Pull requests → Get unique preview URLs

## Custom Domain (Optional)

To add a custom domain:
1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Domains**
3. Add your domain and follow DNS configuration steps

## Monitoring

- View deployment logs: Vercel Dashboard → Deployments
- Check analytics: Vercel Dashboard → Analytics
- Monitor errors: Set up error tracking (Sentry, etc.)

---

**🎉 Your DocuHaven app is now live on Vercel!**
