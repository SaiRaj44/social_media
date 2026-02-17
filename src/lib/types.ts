import { Timestamp } from 'firebase/firestore';

export interface MediaItem {
    fileName: string;
    fileUrl: string;
    thumbnailUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    uploadedAt: Timestamp;
}

export interface Post {
    id?: string;
    title: string;
    content: string;
    platform: 'instagram' | 'twitter' | 'facebook' | 'all';
    status: 'Draft' | 'Pending' | 'Approved' | 'Posted' | 'Rejected';
    media: MediaItem[];
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface AuditLog {
    action: string;
    performedBy: string;
    postId: string;
    fileName?: string;
    details?: string;
    timestamp: Timestamp;
}

export interface UploadProgress {
    fileName: string;
    progress: number;
    status: 'uploading' | 'completed' | 'failed';
    error?: string;
    previewUrl?: string;
}

export interface ImageMetadata {
    width: number;
    height: number;
    make?: string;
    model?: string;
    dateTime?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    orientation?: number;
}
