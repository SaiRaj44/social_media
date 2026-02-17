import { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/constants';

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export function validateFile(file: File): ValidationResult {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB (${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
        };
    }

    // Check MIME type
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
        return {
            valid: false,
            error: `File "${file.name}" has invalid format. Allowed: JPG, PNG, WEBP`,
        };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(extension as typeof ALLOWED_EXTENSIONS[number])) {
        return {
            valid: false,
            error: `File "${file.name}" has invalid extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        };
    }

    return { valid: true };
}

export function validateFiles(files: File[]): { valid: File[]; errors: string[] } {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
        const result = validateFile(file);
        if (result.valid) {
            valid.push(file);
        } else {
            errors.push(result.error!);
        }
    }

    return { valid, errors };
}
