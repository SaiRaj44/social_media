// Authorized users
export const AUTHORIZED_EMAILS = [
    'sairaj@iittp.ac.in',
    'abijith@iittp.ac.in',
    'chalavadivishnu@iittp.ac.in',
] as const;

export const CONTENT_MANAGERS = [
    'sairaj@iittp.ac.in',
    'abijith@iittp.ac.in',
] as const;

export const IN_CHARGE = [
    'chalavadivishnu@iittp.ac.in',
] as const;

// File upload constraints
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

// Image dimensions for different platforms
export const PLATFORM_RATIOS = {
    instagram: { width: 1080, height: 1080, label: 'Instagram (1:1)', ratio: '1:1' },
    twitter: { width: 1200, height: 675, label: 'Twitter (16:9)', ratio: '16:9' },
    facebook: { width: 1200, height: 628, label: 'Facebook (1.91:1)', ratio: '1.91:1' },
} as const;

// Thumbnail dimensions
export const THUMBNAIL_SIZE = 300;

// Storage paths
export const STORAGE_BASE_PATH = 'social-media';

// Post statuses
export const POST_STATUSES = ['Draft', 'Pending', 'Approved', 'Posted', 'Rejected'] as const;
export type PostStatus = typeof POST_STATUSES[number];
