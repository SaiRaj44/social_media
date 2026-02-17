# Storage Security Rules — Explained

## Overview

Firebase Storage and Firestore rules enforce server-side security that cannot be bypassed by client-side code. These rules are the last line of defense.

---

## Firebase Storage Rules

```
File: storage.rules
```

### Rule Breakdown

#### 1. Authentication Check
```
function isAuthenticated() {
  return request.auth != null;
}
```
Every request must include a valid Firebase Auth token.

#### 2. Email Authorization
```
function isAuthorized() {
  return isAuthenticated() &&
    request.auth.token.email in [
      'sairaj@iittp.ac.in',
      'abijith@iittp.ac.in',
      'chalavadivishnu@iittp.ac.in'
    ];
}
```
Only these 3 specific emails are allowed. Even if someone creates a Firebase account, they cannot upload.

#### 3. Image Type Validation
```
function isValidImage() {
  return request.resource.contentType.matches('image/(jpeg|png|webp)');
}
```
Prevents uploading non-image files (PDFs, ZIPs, executables, etc.)

#### 4. File Size Limit
```
function isWithinSizeLimit() {
  return request.resource.size <= 5 * 1024 * 1024;
}
```
Hard 5MB limit enforced at the storage level.

#### 5. Path Restriction
```
match /social-media/{postId}/{allPaths=**} {
  allow create: if isAuthorized() && isValidImage() && isWithinSizeLimit();
}
```
Files can only be created under `/social-media/{postId}/` paths.

#### 6. Default Deny
```
match /{allPaths=**} {
  allow read, write: if false;
}
```
Everything not explicitly allowed is denied.

---

## Firestore Rules

```
File: firestore.rules
```

### Posts Collection

| Operation | Who Can Do It | Conditions |
|-----------|--------------|------------|
| Read | All 3 authorized users | Auth + email check |
| Create | All 3 authorized users | Title must be non-empty string |
| Update | Content Managers | Normal fields |
| Update Status to Approved/Posted | In-Charge only | Role check |
| Delete | All 3 authorized users | Status NOT Approved/Posted |

### Audit Logs Collection

| Operation | Allowed? | Reason |
|-----------|----------|--------|
| Read | Yes (authorized only) | Transparency |
| Create | Yes (authorized only) | Track actions |
| Update | **NO** | Immutability |
| Delete | **NO** | Compliance |

Audit logs are **append-only** — once written, they cannot be modified or deleted by anyone, including admins through the client SDK.

---

## Security Best Practices Applied

1. **No public read access** — Files require authentication to view
2. **Email whitelist** — Not just "any authenticated user"
3. **File type enforcement** — Content-Type header validated
4. **Size limits** — Prevents storage abuse
5. **Append-only audit** — Tamper-proof activity log
6. **Delete protection** — Published content cannot be accidentally removed
7. **Role separation** — Only In-Charge can approve content
8. **Server-side verification** — API routes double-check auth via Firebase Admin SDK

---

## Deployment

Deploy rules using Firebase CLI:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

Or both at once:
```bash
firebase deploy --only firestore:rules,storage
```
