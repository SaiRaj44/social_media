import { NextRequest, NextResponse } from 'next/server';
import { AUTHORIZED_EMAILS } from '@/lib/constants';

// Server-side upload validation endpoint
// Note: Actual file upload goes directly to Firebase Storage from the client
// This API route validates authorization and logs the upload intent

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing authentication token' },
                { status: 401 }
            );
        }

        const token = authHeader.split('Bearer ')[1];

        // Dynamically import firebase-admin to avoid client-side issues
        const { adminAuth, adminDb } = await import('@/lib/firebase-admin');

        // Verify the token
        const decodedToken = await adminAuth.verifyIdToken(token);
        const email = decodedToken.email;

        if (!email || !(AUTHORIZED_EMAILS as readonly string[]).includes(email)) {
            return NextResponse.json(
                { error: 'Unauthorized: Email not in allowed list' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { postId, fileName, fileSize, mimeType } = body;

        // Validate fields
        if (!postId || !fileName) {
            return NextResponse.json(
                { error: 'Missing required fields: postId, fileName' },
                { status: 400 }
            );
        }

        // Validate file size
        if (fileSize && fileSize > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size exceeds 5MB limit' },
                { status: 400 }
            );
        }

        // Validate MIME type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (mimeType && !allowedTypes.includes(mimeType)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: JPG, PNG, WEBP' },
                { status: 400 }
            );
        }

        // Log the upload intent
        await adminDb.collection('auditLogs').add({
            action: 'UPLOAD_AUTHORIZED',
            performedBy: email,
            postId,
            fileName,
            details: `File size: ${fileSize}, Type: ${mimeType}`,
            timestamp: new Date(),
        });

        return NextResponse.json({
            authorized: true,
            message: 'Upload authorized',
            email,
        });
    } catch (error) {
        console.error('Upload validation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
