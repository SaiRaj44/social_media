import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { STORAGE_BASE_PATH } from '@/lib/constants';
import { generateThumbnail } from './generateThumbnail';
import imageCompression from 'browser-image-compression';
import type { MediaItem, UploadProgress } from '@/lib/types';

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

async function uploadFileToStorage(
    fileBlob: Blob,
    storagePath: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, fileBlob);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress);
            },
            (error) => reject(error),
            async () => {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadUrl);
            }
        );
    });
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
        // Compress the image
        const compressed = await compressImage(file);

        // Generate thumbnail
        const thumbnailBlob = await generateThumbnail(file);

        // Create unique filename
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const basePath = `${STORAGE_BASE_PATH}/${postId}`;
        const imagePath = `${basePath}/${timestamp}-${safeName}`;
        const thumbPath = `${basePath}/thumb-${timestamp}-${safeName}`;

        // Upload original (compressed)
        const fileUrl = await uploadFileToStorage(
            compressed,
            imagePath,
            (progress) => {
                onProgress?.({
                    fileName: file.name,
                    progress: progress * 0.8, // 80% for main upload
                    status: 'uploading',
                });
            }
        );

        // Upload thumbnail
        const thumbnailUrl = await uploadFileToStorage(
            thumbnailBlob,
            thumbPath,
            (progress) => {
                onProgress?.({
                    fileName: file.name,
                    progress: 80 + progress * 0.2, // 20% for thumbnail
                    status: 'uploading',
                });
            }
        );

        // Create audit log
        await addDoc(collection(db, 'auditLogs'), {
            action: 'IMAGE_UPLOADED',
            performedBy: userEmail,
            postId,
            fileName: file.name,
            timestamp: Timestamp.now(),
        });

        const mediaItem: MediaItem = {
            fileName: file.name,
            fileUrl,
            thumbnailUrl,
            fileSize: compressed.size,
            mimeType: file.type,
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
