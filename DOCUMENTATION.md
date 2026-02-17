# IIT Tirupati Social Media Manager — Full Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Firebase Configuration](#4-firebase-configuration)
5. [Environment Variables (.env)](#5-environment-variables-env)
6. [Next.js App Architecture](#6-nextjs-app-architecture)
7. [Module Documentation](#7-module-documentation)
8. [GitHub Repository](#8-github-repository)
9. [Vercel Deployment](#9-vercel-deployment)
10. [Local Development Setup](#10-local-development-setup)
11. [Security & Access Control](#11-security--access-control)

---

## 1. Project Overview

The **IIT Tirupati Social Media Manager** is an institutional web application for managing social media content workflows. It enables authorized team members to:

- **Create** social media posts with images for Instagram, Twitter, and Facebook
- **Save drafts** for later editing before submission
- **Submit posts for review** to an In-Charge for approval
- **Track activity** via audit logs
- **Manage media** with local file storage

### Live URLs

| Environment | URL |
|-------------|-----|
| **Production (Vercel)** | https://social-media-blue-delta.vercel.app |
| **Local Development** | http://localhost:3001 |

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 16** (App Router, Turbopack) |
| Language | **TypeScript** |
| Authentication | **Firebase Auth** (Google OAuth) |
| Database | **Cloud Firestore** (client SDK) |
| Image Storage | **Local File System** (`public/uploads/`) |
| Image Compression | **browser-image-compression** |
| UI Animations | **Framer Motion** |
| Notifications | **Sonner** (toast notifications) |
| Icons | **Lucide React** |
| Hosting | **Vercel** |
| Version Control | **GitHub** |

---

## 3. Project Structure

```
social_media/
├── .env.local                 # Environment variables (not committed)
├── .env.example               # Template for env variables
├── firestore.rules            # Firestore security rules
├── package.json
├── tsconfig.json
├── next.config.ts
├── DOCUMENTATION.md           # This file
│
├── public/
│   ├── uploads/               # Local image uploads (gitignored)
│   └── ...                    # Static assets
│
└── src/
    ├── app/
    │   ├── layout.tsx          # Root layout with AuthProvider
    │   ├── page.tsx            # Login page (/)
    │   ├── globals.css         # Global styles & design system
    │   │
    │   ├── api/
    │   │   ├── local-upload/
    │   │   │   └── route.ts    # POST: Local image upload endpoint
    │   │   ├── posts/
    │   │   │   ├── route.ts    # GET/POST: List & create posts
    │   │   │   └── [postId]/
    │   │   │       └── route.ts # PATCH/DELETE: Update & delete posts
    │   │   └── upload/
    │   │       └── route.ts    # Legacy upload validation endpoint
    │   │
    │   └── dashboard/
    │       ├── layout.tsx      # Dashboard layout with navigation
    │       ├── page.tsx        # Dashboard home (post list + stats)
    │       ├── posts/
    │       │   ├── new/
    │       │   │   └── page.tsx # Create new post form
    │       │   └── [postId]/
    │       │       └── page.tsx # Edit existing post
    │       └── storage/
    │           └── page.tsx    # Storage & audit log page
    │
    ├── components/
    │   └── media/
    │       ├── ImagePreview.tsx  # Thumbnail grid with reorder
    │       ├── LightboxModal.tsx # Full-screen image viewer
    │       ├── ProgressBar.tsx   # Upload progress indicator
    │       ├── StorageDashboard.tsx # Stats cards (images, storage, posts)
    │       └── UploadZone.tsx    # Drag-and-drop file upload
    │
    └── lib/
        ├── auth/
        │   └── AuthContext.tsx  # React context for Firebase Auth
        ├── storage/
        │   ├── uploadImage.ts   # Client-side upload logic
        │   ├── validateFile.ts  # File type & size validation
        │   └── generateThumbnail.ts # Client-side thumbnail gen
        ├── firebase.ts          # Firebase client SDK init
        ├── firebase-admin.ts    # Firebase Admin SDK init
        ├── constants.ts         # Auth emails, file limits, platforms
        └── types.ts             # TypeScript interfaces
```

---

## 4. Firebase Configuration

### 4.1 Firebase Project

| Setting | Value |
|---------|-------|
| **Project Name** | `iittp-social-media` |
| **Project ID** | `iittp-social-media` |
| **Console URL** | https://console.firebase.google.com/project/iittp-social-media |

### 4.2 Enabled Services

| Service | Status | Details |
|---------|--------|---------|
| **Authentication** | ✅ Enabled | Google Sign-In provider |
| **Cloud Firestore** | ✅ Enabled | Default database, production mode |
| **Storage** | ❌ Not used | Replaced with local file storage |

### 4.3 Firebase Authentication Setup

1. Go to **Firebase Console** → **Authentication** → **Sign-in method**
2. Enable **Google** as a sign-in provider
3. Set the **Project support email**
4. Add your Vercel domain to **Authorized domains**:
   - `social-media-blue-delta.vercel.app`
   - `localhost` (already added by default)

### 4.4 Firestore Collections

| Collection | Purpose | Fields |
|------------|---------|--------|
| `posts` | Social media posts | `title`, `content`, `platform`, `status`, `media[]`, `createdBy`, `createdAt`, `updatedAt` |
| `auditLogs` | Activity tracking | `action`, `performedBy`, `postId`, `fileName`, `timestamp` |

### 4.5 Firestore Security Rules

Located in `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authorized @iittp.ac.in emails can access
    // Posts: CRUD with status-based restrictions
    // AuditLogs: Read + Create only (append-only)
    // Delete: Allowed for Draft/Pending/Rejected posts only
    // Approve/Post: In-Charge only
  }
}
```

> **Important:** After modifying `firestore.rules`, deploy them using:
> ```bash
> firebase deploy --only firestore:rules
> ```

### 4.6 Firebase Web App Registration

1. Go to **Firebase Console** → **Project Settings** → **General**
2. Under **Your apps**, click **Add app** → **Web** (</> icon)
3. Register with nickname (e.g., `social-media-web`)
4. Copy the `firebaseConfig` object — these values go into `.env.local`

### 4.7 Firebase Admin SDK (Service Account)

1. Go to **Firebase Console** → **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Extract these values for `.env.local`:
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`

---

## 5. Environment Variables (.env)

### 5.1 File: `.env.local`

Create this file in the project root (never commit to git):

```env
# Firebase Client SDK (from Firebase Console → Project Settings → General)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCdbjJ5qi4F4RTcyJN5ZB2L_oN0CkqlpVE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=iittp-social-media.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=iittp-social-media
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=iittp-social-media.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1061127147876
NEXT_PUBLIC_FIREBASE_APP_ID=1:1061127147876:web:cb882388c5d8e09e8d2a71

# Firebase Admin SDK (from Service Account key JSON)
FIREBASE_ADMIN_PROJECT_ID=iittp-social-media
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@iittp-social-media.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
```

### 5.2 Variable Reference

| Variable | Prefix | Source | Used By |
|----------|--------|--------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public | Firebase Console | Client SDK (browser) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public | Firebase Console | Google Auth popup |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public | Firebase Console | Firestore connection |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public | Firebase Console | (Legacy, kept for config) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public | Firebase Console | Firebase init |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public | Firebase Console | Firebase init |
| `FIREBASE_ADMIN_PROJECT_ID` | Server | Service Account JSON | Admin SDK (API routes) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Server | Service Account JSON | Admin SDK auth |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Server | Service Account JSON | Admin SDK auth |

> **Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Server-only variables (without the prefix) are only accessible in API routes and server components.

---

## 6. Next.js App Architecture

### 6.1 App Router Structure

This project uses the **Next.js App Router** (not Pages Router):

- **`src/app/page.tsx`** → Login page at `/`
- **`src/app/dashboard/`** → Protected dashboard pages
- **`src/app/api/`** → Backend API routes

### 6.2 Authentication Flow

```
User visits / → Login page
  ↓ Click "Sign in with Google"
  ↓ Firebase Auth popup
  ↓ Check email against AUTHORIZED_EMAILS
  ↓ If authorized → redirect to /dashboard
  ↓ If not → show "Unauthorized" error
```

### 6.3 Post Workflow

```
Create Post (/dashboard/posts/new)
  ↓ Fill title, content, platform, add images
  ↓ "Save Draft" → status = 'Draft'
  ↓ "Submit for Review" → status = 'Pending'
  ↓ In-Charge reviews → 'Approved' or 'Rejected'
  ↓ Approved → 'Posted' (after publishing)
```

### 6.4 Image Upload Flow

```
User selects images (drag & drop or browse)
  ↓ Client-side validation (type, size)
  ↓ Client-side compression (browser-image-compression)
  ↓ POST to /api/local-upload
  ↓ Server saves to public/uploads/{postId}/
  ↓ Returns local URLs (fileUrl, thumbnailUrl)
  ↓ URLs stored in Firestore post.media[]
```

---

## 7. Module Documentation

### 7.1 Authentication Module (`src/lib/auth/`)

**File:** `AuthContext.tsx`

Provides a React context wrapping Firebase Auth. Features:
- Google Sign-In via popup
- Email authorization check against `AUTHORIZED_EMAILS`
- Role detection (Content Manager vs In-Charge)
- Auto-redirect: unauthenticated users → login, authenticated → dashboard
- Loading state management

**Key exports:**
- `useAuth()` — hook returning `{ user, loading, signIn, signOut }`

### 7.2 Firebase Module (`src/lib/firebase.ts`)

Initializes the Firebase client SDK using `NEXT_PUBLIC_*` environment variables:
- `auth` — Firebase Auth instance
- `db` — Firestore instance

### 7.3 Firebase Admin Module (`src/lib/firebase-admin.ts`)

Initializes the Firebase Admin SDK using server-side `FIREBASE_ADMIN_*` variables. Used by API routes for server-side Firestore operations and token verification.

### 7.4 Storage Module (`src/lib/storage/`)

| File | Purpose |
|------|---------|
| `uploadImage.ts` | Compresses images client-side, POSTs to `/api/local-upload`, returns `MediaItem` |
| `validateFile.ts` | Validates file MIME type and size against constants |
| `generateThumbnail.ts` | Creates thumbnails using canvas (client-side) |

### 7.5 Constants Module (`src/lib/constants.ts`)

Defines:
- `AUTHORIZED_EMAILS` — list of allowed Google accounts
- `CONTENT_MANAGERS` — users who can create/edit posts
- `IN_CHARGE` — users who can approve/reject posts
- `MAX_FILE_SIZE` — 5MB limit
- `ALLOWED_MIME_TYPES` — JPEG, PNG, WebP
- `PLATFORM_RATIOS` — image dimensions per social platform
- `POST_STATUSES` — Draft, Pending, Approved, Posted, Rejected

### 7.6 Types Module (`src/lib/types.ts`)

TypeScript interfaces:
- `MediaItem` — `{ fileUrl, thumbnailUrl, fileName, fileSize, mimeType }`
- `Post` — `{ id, title, content, platform, status, media[], createdBy, createdAt, updatedAt }`
- `AuditLog` — `{ action, performedBy, postId, fileName, timestamp }`
- `UploadProgress` — `{ status, progress, fileName }`

### 7.7 API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/local-upload` | POST | Saves uploaded images to `public/uploads/{postId}/` |
| `/api/posts` | GET | Lists all posts (Admin SDK) |
| `/api/posts` | POST | Creates a new post (Admin SDK) |
| `/api/posts/[postId]` | PATCH | Updates a post |
| `/api/posts/[postId]` | DELETE | Deletes a post |
| `/api/upload` | POST | Legacy upload validation |

### 7.8 UI Components (`src/components/media/`)

| Component | Purpose |
|-----------|---------|
| `UploadZone` | Drag-and-drop file upload area with react-dropzone |
| `ImagePreview` | Thumbnail grid with drag-to-reorder support |
| `ProgressBar` | Shows upload progress for each file |
| `LightboxModal` | Full-screen image viewer with navigation |
| `StorageDashboard` | Stats cards showing total images, storage, posts |

### 7.9 Pages

| Page | Route | Purpose |
|------|-------|---------|
| Login | `/` | Google Sign-In with authorization check |
| Dashboard | `/dashboard` | Post list, stats overview, delete posts |
| New Post | `/dashboard/posts/new` | Create post form with media upload |
| Edit Post | `/dashboard/posts/[postId]` | Edit/delete existing post |
| Storage & Audit | `/dashboard/storage` | Storage stats and activity log |

---

## 8. GitHub Repository

### 8.1 Repository Info

| Setting | Value |
|---------|-------|
| **URL** | https://github.com/SaiRaj44/social_media |
| **Branch** | `main` |
| **Visibility** | Public |

### 8.2 Key Files in Repository

| File | Description |
|------|-------------|
| `.env.example` | Template for environment variables |
| `firestore.rules` | Firestore security rules |
| `package.json` | Dependencies and scripts |
| `DOCUMENTATION.md` | This documentation file |
| `.gitignore` | Excludes `node_modules/`, `.env.local`, `.next/`, `public/uploads/` |

### 8.3 Git Workflow

```bash
# Clone the repository
git clone https://github.com/SaiRaj44/social_media.git
cd social_media

# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env.local
# Edit .env.local with your Firebase credentials

# Start development server
npm run dev

# Build for production
npm run build

# Commit and push changes
git add -A
git commit -m "your commit message"
git push origin main
```

---

## 9. Vercel Deployment

### 9.1 Deployment Info

| Setting | Value |
|---------|-------|
| **Project Name** | `social-media` |
| **Production URL** | https://social-media-blue-delta.vercel.app |
| **Framework** | Next.js (auto-detected) |
| **Build Command** | `next build` (default) |
| **Output Directory** | `.next` (default) |
| **Node.js Version** | 20.x |

### 9.2 Initial Setup

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Select the GitHub repository: `SaiRaj44/social_media`
4. Vercel auto-detects Next.js framework
5. Add all environment variables (see Section 5.1)
6. Click **"Deploy"**

### 9.3 Environment Variables on Vercel

Navigate to **Vercel Dashboard** → **Project** → **Settings** → **Environment Variables**

Add all variables from Section 5.1. Ensure `FIREBASE_ADMIN_PRIVATE_KEY` includes the full PEM-encoded key (with `\n` for newlines).

### 9.4 Auto-Deploy

Vercel automatically deploys when you push to the `main` branch. No manual intervention needed after initial setup.

### 9.5 Firebase Auth Domain

Add your Vercel domain to Firebase's **Authorized Domains**:

1. **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**
2. Add: `social-media-blue-delta.vercel.app`

### 9.6 Important: Local Storage Limitation on Vercel

> **⚠️ Note:** Local file storage (`public/uploads/`) is **ephemeral on Vercel**. Uploaded images will be lost when the serverless function cold-starts. For production use, consider migrating to a cloud storage service (Firebase Storage with Blaze plan, AWS S3, or Cloudinary).

For the current development/testing phase, the local upload works for demonstration purposes. For persistent storage options, see Section 11.

---

## 10. Local Development Setup

### 10.1 Prerequisites

- **Node.js** 18+ (recommended: 20.x)
- **npm** 9+
- **Git**
- A Google account with `@iittp.ac.in` domain

### 10.2 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/SaiRaj44/social_media.git
cd social_media

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — see Section 5 for values

# 4. Start dev server
npm run dev
# → Open http://localhost:3001

# 5. Build for production
npm run build

# 6. Start production server
npm start
```

### 10.3 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack, hot reload) |
| `npm run build` | Build production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 11. Security & Access Control

### 11.1 Authorized Users

Currently configured in `src/lib/constants.ts`:

| Email | Role | Notes |
|-------|------|-------|
| `sairaj@iittp.ac.in` | Content Manager | Create & edit posts |
| `abijith@iittp.ac.in` | Content Manager | Create & edit posts |
| `at250015@iittp.ac.in` | In-Charge (temporary) | Can approve/reject posts |

> **Note:** `chalavadivishnu@iittp.ac.in` is commented out as the permanent In-Charge. Uncomment when ready to restore.

### 11.2 Role Permissions

| Action | Content Manager | In-Charge |
|--------|:-:|:-:|
| Sign in | ✅ | ✅ |
| Create posts | ✅ | ✅ |
| Save drafts | ✅ | ✅ |
| Submit for review | ✅ | ✅ |
| Edit own posts | ✅ | ✅ |
| Delete draft/pending | ✅ | ✅ |
| Approve/Reject posts | ❌ | ✅ |
| Mark as Posted | ❌ | ✅ |
| Delete approved/posted | ❌ | ❌ |

### 11.3 Changing Authorized Users

1. Edit `src/lib/constants.ts` — update `AUTHORIZED_EMAILS`, `CONTENT_MANAGERS`, and/or `IN_CHARGE`
2. Edit `firestore.rules` — update the email lists in `isAuthorized()` and `isInCharge()`
3. Deploy Firestore rules: `firebase deploy --only firestore:rules`
4. Commit, push, and Vercel auto-deploys

---

## Appendix: Dependency List

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.6 | React framework |
| `react` / `react-dom` | 19.x | UI library |
| `firebase` | 11.x | Client SDK (Auth, Firestore) |
| `firebase-admin` | 13.x | Server SDK (API routes) |
| `browser-image-compression` | 2.x | Client-side image compression |
| `framer-motion` | 12.x | Animations |
| `lucide-react` | 0.47x | Icons |
| `sonner` | 2.x | Toast notifications |
| `react-dropzone` | 14.x | Drag & drop file upload |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | Type checking |
| `@types/react` | React type definitions |
| `eslint` | Linting |
| `eslint-config-next` | Next.js ESLint rules |
