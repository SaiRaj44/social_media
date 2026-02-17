# Media Architecture Document

## System Overview

The Social Media Content Manager is an enterprise-grade media management system designed for institutional use at IIT Tirupati. It provides a complete workflow for creating, managing, and publishing social media content with rich media support.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VERCEL (Production)                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Next.js 15 (App Router)                    │  │
│  │                                                               │  │
│  │  ┌─────────────────────┐  ┌────────────────────────────────┐  │  │
│  │  │   Static Pages      │  │   Server API Routes            │  │  │
│  │  │   ─────────────     │  │   ──────────────────           │  │  │
│  │  │   / (Login)         │  │   /api/upload                  │  │  │
│  │  │   /dashboard        │  │   /api/posts                   │  │  │
│  │  │   /dashboard/new    │  │   /api/posts/[postId]          │  │  │
│  │  │   /dashboard/storage│  │                                │  │  │
│  │  └─────────────────────┘  └─────────────┬──────────────────┘  │  │
│  │            │                            │ Firebase Admin SDK   │  │
│  └────────────┼────────────────────────────┼─────────────────────┘  │
│               │                            │                        │
└───────────────┼────────────────────────────┼────────────────────────┘
                │ Firebase Client SDK        │
                ▼                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      FIREBASE (Google Cloud)                         │
│                                                                       │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│  │   Firebase Auth  │  │  Cloud Firestore │  │  Firebase Storage   │  │
│  │   ─────────────  │  │  ──────────────  │  │  ─────────────────  │  │
│  │   Google OAuth   │  │  posts           │  │  /social-media/     │  │
│  │   Email restrict │  │  auditLogs       │  │    /{postId}/       │  │
│  │   Token verify   │  │                  │  │      images         │  │
│  └─────────────────┘  └──────────────────┘  │      thumbnails     │  │
│                                              └─────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Upload Flow

```
1. User selects/drops files
       │
       ▼
2. Client-Side Validation
   ├── File size ≤ 5MB?
   ├── MIME type: image/jpeg, image/png, image/webp?
   └── Extension: .jpg, .jpeg, .png, .webp?
       │
       ▼ (valid files only)
3. Client-Side Compression
   ├── browser-image-compression
   ├── Max 1MB output, max 1920px dimension
   └── WebWorker processing
       │
       ▼
4. Thumbnail Generation
   ├── Canvas API: 300x300px
   └── JPEG quality: 0.8
       │
       ▼
5. Firebase Storage Upload (Resumable)
   ├── Path: /social-media/{postId}/{timestamp}-{filename}
   ├── Thumbnail: /social-media/{postId}/thumb-{timestamp}-{filename}
   └── Progress callback → UI updates
       │
       ▼
6. Post Update
   ├── Firestore: media[] array updated
   └── Audit log entry created
```

---

## Data Model

### Posts Collection (`/posts/{postId}`)

| Field | Type | Description |
|-------|------|-------------|
| title | string | Post title (required) |
| content | string | Post caption/content |
| platform | enum | `instagram`, `twitter`, `facebook`, `all` |
| status | enum | `Draft`, `Pending`, `Approved`, `Posted`, `Rejected` |
| media | array | Array of MediaItem objects |
| createdBy | string | User email |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update time |

### MediaItem (embedded in Post)

| Field | Type | Description |
|-------|------|-------------|
| fileName | string | Original file name |
| fileUrl | string | Firebase Storage download URL |
| thumbnailUrl | string | Thumbnail download URL |
| fileSize | number | Compressed file size in bytes |
| mimeType | string | MIME type |
| uploadedBy | string | Uploader email |
| uploadedAt | timestamp | Upload time |

### Audit Logs Collection (`/auditLogs/{logId}`)

| Field | Type | Description |
|-------|------|-------------|
| action | string | `IMAGE_UPLOADED`, `POST_CREATED`, `POST_UPDATED`, `POST_DELETED` |
| performedBy | string | User email |
| postId | string | Related post ID |
| fileName | string | Related file (for uploads) |
| timestamp | timestamp | Action time |

---

## Image Optimization Strategy

| Stage | Tool | Configuration |
|-------|------|---------------|
| Compression | browser-image-compression | maxSizeMB: 1, maxWidth: 1920, WebWorker |
| Thumbnail | Canvas API | 300×300px, JPEG 0.8 quality |
| Blur Placeholder | Canvas API | 10×10px, JPEG 0.1 quality |
| Platform Resize | Canvas API | Instagram 1080×1080, Twitter 1200×675, Facebook 1200×628 |
| Rendering | Next.js Image | Lazy loading, blur placeholders |

---

## Security Layers

| Layer | Mechanism | What It Protects |
|-------|-----------|-----------------|
| 1. Client Auth | Firebase Auth (Google) | App access |
| 2. Email Check | AuthContext + constants | Restricts to 3 users |
| 3. Storage Rules | Firebase Storage rules | File uploads |
| 4. Firestore Rules | Firestore security rules | Data access |
| 5. API Middleware | Firebase Admin token verify | Server endpoints |
| 6. Role-Based | In-Charge vs Content Manager | Status changes |

---

## Performance Considerations

- **Resumable uploads**: Firebase SDK handles network interruptions
- **Client-side compression**: Reduces upload size by 50-80%
- **Lazy loading**: Images load on scroll
- **Blur placeholders**: Fast visual feedback
- **Caching**: Firebase Storage CDN for served files
- **Static generation**: Dashboard pages pre-rendered where possible
