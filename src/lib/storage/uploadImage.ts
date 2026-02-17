import imageCompression from 'browser-image-compression';
import type { MediaItem, UploadProgress } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

interface UploadOptions {
    postId: string;
    userEmail: string;
    onProgress?: (progress: UploadProgress) => void;
}

export async function compressImage(file: File): Promise<File> {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type as string,
    };

    try {
        const compressed = await imageCompression(file, options);
        return compressed;
    } catch (error) {
        console.warn('Compression failed, using original:', error);
        return file;
    }
}

export async function uploadImage(
    file: File,
    options: UploadOptions
): Promise<MediaItem> {
    const { postId, userEmail, onProgress } = options;

    // Update status
    onProgress?.({
        fileName: file.name,
        progress: 0,
        status: 'uploading',
        previewUrl: URL.createObjectURL(file),
    });

    try {
        // Compress the image client-side
        onProgress?.({
            fileName: file.name,
            progress: 10,
            status: 'uploading',
        });
        const compressed = await compressImage(file);

        onProgress?.({
            fileName: file.name,
            progress: 30,
            status: 'uploading',
        });

        // Upload to local storage via API
        const formData = new FormData();
        formData.append('file', compressed, file.name);
        formData.append('postId', postId);
        formData.append('thumbnail', 'true');

        const response = await fetch('/api/local-upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
        }

        onProgress?.({
            fileName: file.name,
            progress: 90,
            status: 'uploading',
        });

        const data = await response.json();

        const mediaItem: MediaItem = {
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            thumbnailUrl: data.thumbnailUrl,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            uploadedBy: userEmail,
            uploadedAt: Timestamp.now(),
        };

        onProgress?.({
            fileName: file.name,
            progress: 100,
            status: 'completed',
        });

        return mediaItem;
    } catch (error) {
        onProgress?.({
            fileName: file.name,
            progress: 0,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Upload failed',
        });
        throw error;
    }
}

export async function uploadMultipleImages(
    files: File[],
    options: Omit<UploadOptions, 'onProgress'> & {
        onProgress?: (fileName: string, progress: UploadProgress) => void;
    }
): Promise<MediaItem[]> {
    const results: MediaItem[] = [];

    for (const file of files) {
        const mediaItem = await uploadImage(file, {
            ...options,
            onProgress: (progress) => {
                options.onProgress?.(file.name, progress);
            },
        });
        results.push(mediaItem);
    }

    return results;
}
