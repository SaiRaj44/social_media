# Social Media Content Manager — IIT Tirupati

Enterprise-grade Image Upload & Media Management System for IIT Tirupati's social media content workflow.

**Live Production**: [iittp-cse-social-media-handler.vercel.app](https://iittp-cse-social-media-handler.vercel.app)

---

## ✨ Features

- **Secure Authentication** — Google Sign-In restricted to authorized IIT Tirupati emails only
- **Drag & Drop Upload** — Multi-file upload with live previews and progress bars
- **Image Optimization** — Client-side compression before upload + auto thumbnail generation
- **Image Reordering** — Drag-to-reorder for carousel posts
- **Platform Auto-Resize** — Instagram (1:1), Twitter (16:9), Facebook (1.91:1)
- **Full-Screen Lightbox** — Preview with keyboard navigation and zoom
- **Audit Logging** — Every upload action tracked with timestamp and user
- **Storage Dashboard** — Visual usage metrics and activity history
- **Firebase Security Rules** — Email-based authorization, file type/size restrictions
- **Role-Based Access** — In-Charge can approve/reject, Content Managers can create/edit

---

## 🏗 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Auth** | Firebase Authentication (Google) |
| **Database** | Cloud Firestore |
| **Storage** | Firebase Storage |
| **Animations** | Framer Motion |
| **Drag & Drop** | @dnd-kit |
| **Upload** | react-dropzone |
| **Compression** | browser-image-compression |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

---

## 👥 Authorized Users

| Role | Email |
|------|-------|
| Content Manager | sairaj@iittp.ac.in |
| Content Manager | abijith@iittp.ac.in |
| In-Charge | chalavadivishnu@iittp.ac.in |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/route.ts          # Upload validation API
│   │   └── posts/
│   │       ├── route.ts             # Posts CRUD API
│   │       └── [postId]/route.ts    # Single post API
│   ├── dashboard/
│   │   ├── layout.tsx               # Dashboard layout + nav
│   │   ├── page.tsx                 # Post grid + stats
│   │   ├── posts/
│   │   │   ├── new/page.tsx         # Create post
│   │   │   └── [postId]/page.tsx    # Edit post
│   │   └── storage/page.tsx         # Storage & audit
│   ├── globals.css                  # Design system
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Login page
├── components/media/
│   ├── UploadZone.tsx               # Drag & drop upload
│   ├── ImagePreview.tsx             # Sortable image grid
│   ├── ProgressBar.tsx              # Upload progress
│   ├── LightboxModal.tsx            # Full-screen preview
│   └── StorageDashboard.tsx         # Usage stats
└── lib/
    ├── auth/AuthContext.tsx          # Auth provider
    ├── storage/
    │   ├── validateFile.ts          # File validation
    │   ├── uploadImage.ts           # Upload + compress
    │   ├── generateThumbnail.ts     # Thumbnail gen
    │   └── imageResize.ts           # Platform resize
    ├── firebase.ts                  # Client SDK
    ├── firebase-admin.ts            # Admin SDK
    ├── constants.ts                 # Config
    └── types.ts                     # TypeScript types
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Auth, Firestore, and Storage enabled
- Google Auth provider enabled in Firebase Console

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/social_media.git
cd social_media

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your Firebase credentials in .env.local

# Run development server
npm run dev
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project or select existing one
3. Enable **Authentication** → Sign-in method → Google
4. Create **Cloud Firestore** database
5. Enable **Firebase Storage**
6. Copy config values to `.env.local`

### Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init
firebase login
firebase init

# Deploy rules
firebase deploy --only firestore:rules,storage
```

---

## 🔐 Security

### Firebase Storage Rules
- Upload limited to authenticated authorized emails
- File type restricted to `image/jpeg`, `image/png`, `image/webp`
- File size limited to 5MB
- No public read access

### Firestore Rules
- Posts: CRUD by authorized users only
- Status changes to Approved/Posted: In-Charge only
- Deletion blocked for Approved/Posted posts
- Audit logs: Append-only (no update/delete)

### API Routes
- Server-side token verification via Firebase Admin SDK
- Email authorization check on every request
- Audit logging for all actions

---

## 📊 Storage Architecture

```
Firebase Storage:
/social-media/
    /{postId}/
        {timestamp}-image.jpg        # Compressed original
        thumb-{timestamp}-image.jpg  # 300px thumbnail
```

### Firestore Schema

**Posts Collection:**
```typescript
{
  title: string,
  content: string,
  platform: 'instagram' | 'twitter' | 'facebook' | 'all',
  status: 'Draft' | 'Pending' | 'Approved' | 'Posted' | 'Rejected',
  media: MediaItem[],
  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Audit Logs Collection:**
```typescript
{
  action: string,
  performedBy: string,
  postId: string,
  fileName?: string,
  timestamp: Timestamp
}
```

---

## 🌐 Deployment (Vercel)

1. Push to GitHub
2. Connect repo in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add environment variables in Vercel project settings
4. Set custom domain: `iittp-cse-social-media-handler.vercel.app`
5. Deploy

### Required Environment Variables in Vercel

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

---

## 📄 License

Internal tool for IIT Tirupati. All rights reserved.
