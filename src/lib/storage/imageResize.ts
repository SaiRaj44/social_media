import { PLATFORM_RATIOS } from '@/lib/constants';

type Platform = keyof typeof PLATFORM_RATIOS;

export async function resizeForPlatform(
    file: File,
    platform: Platform
): Promise<Blob> {
    const config = PLATFORM_RATIOS[platform];

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

                canvas.width = config.width;
                canvas.height = config.height;

                // Calculate crop dimensions (center crop)
                const targetRatio = config.width / config.height;
                const imgRatio = img.width / img.height;

                let srcX = 0;
                let srcY = 0;
                let srcWidth = img.width;
                let srcHeight = img.height;

                if (imgRatio > targetRatio) {
                    // Image is wider - crop sides
                    srcWidth = img.height * targetRatio;
                    srcX = (img.width - srcWidth) / 2;
                } else {
                    // Image is taller - crop top/bottom
                    srcHeight = img.width / targetRatio;
                    srcY = (img.height - srcHeight) / 2;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, config.width, config.height);

                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(url);
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to resize image'));
                        }
                    },
                    file.type || 'image/jpeg',
                    0.9
                );
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

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}
