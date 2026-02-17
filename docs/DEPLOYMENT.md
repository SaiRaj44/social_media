# Deployment Guide — Vercel + Firebase

## Prerequisites

- GitHub account with repository access
- Vercel account connected to GitHub
- Firebase project with services enabled

---

## Step 1: Firebase Console Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** → Enter project name → Continue
3. Disable Google Analytics (optional) → Create Project

### 1.2 Enable Authentication
1. Navigate to **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Set support email
4. Save

### 1.3 Create Firestore Database
1. Navigate to **Cloud Firestore** → **Create Database**
2. Select **Start in production mode**
3. Choose closest region → Done

### 1.4 Enable Firebase Storage
1. Navigate to **Storage** → **Get Started**
2. Start in production mode
3. Choose closest region → Done

### 1.5 Get Configuration Values
1. Go to **Project Settings** → **General**
2. Under **Your apps** → Click **Web** (</>) icon
3. Register app → Copy config values:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

### 1.6 Generate Admin SDK Key
1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Download JSON file
4. Note: `project_id`, `client_email`, and `private_key`

---

## Step 2: Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select Firestore and Storage)
firebase init

# Deploy rules
firebase deploy --only firestore:rules,storage
```

---

## Step 3: GitHub Repository

```bash
# Initialize and push
cd /path/to/social_media
git add .
git commit -m "feat: enterprise media management system"
git remote add origin https://github.com/YOUR_USERNAME/social_media.git
git push -u origin main
```

---

## Step 4: Vercel Deployment

### 4.1 Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Framework: **Next.js** (auto-detected)

### 4.2 Environment Variables
Add these in Vercel project settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase Console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your app ID |
| `FIREBASE_ADMIN_PROJECT_ID` | Your project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Full private key (with `\n`) |

> **Important**: For `FIREBASE_ADMIN_PRIVATE_KEY`, paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`.

### 4.3 Custom Domain
1. Go to Vercel project → **Settings** → **Domains**
2. Your project will be available at: `iittp-cse-social-media-handler.vercel.app`

### 4.4 Deploy
Click **Deploy** — Vercel will build and deploy automatically.

---

## Step 5: Firebase Auth Domain Configuration

After deploying to Vercel:

1. Go to Firebase Console → **Authentication** → **Settings**
2. Under **Authorized domains**, add:
   - `iittp-cse-social-media-handler.vercel.app`
3. This allows Google Sign-In to work from the production domain

---

## Step 6: Verify Production

1. Visit `https://iittp-cse-social-media-handler.vercel.app`
2. Sign in with an authorized Google account
3. Create a test post with image upload
4. Verify:
   - Image appears in Firebase Storage
   - Post appears in Firestore
   - Audit log entry created
   - Unauthorized emails are blocked

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Google Sign-In fails | Add Vercel domain to Firebase Auth authorized domains |
| Upload fails | Check Firebase Storage rules are deployed |
| 500 on API routes | Verify FIREBASE_ADMIN_PRIVATE_KEY format in Vercel |
| Build fails | Run `npm run build` locally first to check for errors |
| Images not loading | Check CORS settings on Firebase Storage |

---

## Auto-Deployment

With Vercel + GitHub:
- Every push to `main` triggers production deployment
- Pull requests get preview deployments
- Environment variables are injected at build time
