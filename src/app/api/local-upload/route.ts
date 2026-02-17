import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const postId = formData.get('postId') as string | null;
        const generateThumb = formData.get('thumbnail') === 'true';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!postId) {
            return NextResponse.json({ error: 'postId is required' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: JPG, PNG, WEBP' },
                { status: 400 }
            );
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size exceeds 5MB limit' },
                { status: 400 }
            );
        }

        // Create upload directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', postId);
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}-${safeName}`;

        // Write original file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${postId}/${fileName}`;

        // For thumbnails, we just use the same image at a smaller path
        // (client-side will handle display sizing; server thumbnail generation
        //  would require sharp which may not be installed)
        let thumbnailUrl = fileUrl;
        if (generateThumb) {
            const thumbName = `thumb-${fileName}`;
            const thumbPath = path.join(uploadDir, thumbName);
            await writeFile(thumbPath, buffer);
            thumbnailUrl = `/uploads/${postId}/${thumbName}`;
        }

        return NextResponse.json({
            success: true,
            fileUrl,
            thumbnailUrl,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
        });
    } catch (error) {
        console.error('Local upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
