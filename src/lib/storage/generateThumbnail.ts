import { THUMBNAIL_SIZE } from '@/lib/constants';

export async function generateThumbnail(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Calculate dimensions maintaining aspect ratio
                let width = THUMBNAIL_SIZE;
                let height = THUMBNAIL_SIZE;
                const aspectRatio = img.width / img.height;

                if (aspectRatio > 1) {
                    height = THUMBNAIL_SIZE / aspectRatio;
                } else {
                    width = THUMBNAIL_SIZE * aspectRatio;
                }

                canvas.width = width;
                canvas.height = height;

                // Enable smooth scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(url);
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to generate thumbnail'));
                        }
                    },
                    'image/jpeg',
                    0.8
                );
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image for thumbnail generation'));
        };

        img.src = url;
    });
}

export async function generateBlurDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Very small size for blur placeholder
                canvas.width = 10;
                canvas.height = 10;

                ctx.drawImage(img, 0, 0, 10, 10);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.1);
                URL.revokeObjectURL(url);
                resolve(dataUrl);
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}
