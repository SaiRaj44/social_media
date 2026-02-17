import { NextRequest, NextResponse } from 'next/server';
import { AUTHORIZED_EMAILS } from '@/lib/constants';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const { adminAuth, adminDb } = await import('@/lib/firebase-admin');
        const decodedToken = await adminAuth.verifyIdToken(token);
        const email = decodedToken.email;

        if (!email || !(AUTHORIZED_EMAILS as readonly string[]).includes(email)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const snapshot = await adminDb
            .collection('posts')
            .orderBy('createdAt', 'desc')
            .get();

        const posts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const { adminAuth, adminDb } = await import('@/lib/firebase-admin');
        const decodedToken = await adminAuth.verifyIdToken(token);
        const email = decodedToken.email;

        if (!email || !(AUTHORIZED_EMAILS as readonly string[]).includes(email)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { title, content, platform, status, media } = body;

        if (!title?.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const now = new Date();
        const postRef = await adminDb.collection('posts').add({
            title: title.trim(),
            content: content?.trim() || '',
            platform: platform || 'all',
            status: status || 'Draft',
            media: media || [],
            createdBy: email,
            createdAt: now,
            updatedAt: now,
        });

        // Audit log
        await adminDb.collection('auditLogs').add({
            action: 'POST_CREATED',
            performedBy: email,
            postId: postRef.id,
            timestamp: now,
        });

        return NextResponse.json({
            id: postRef.id,
            message: 'Post created successfully',
        });
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
