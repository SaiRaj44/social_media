import { NextRequest, NextResponse } from 'next/server';
import { AUTHORIZED_EMAILS } from '@/lib/constants';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
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

        const doc = await adminDb.collection('posts').doc(postId).get();
        if (!doc.exists) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        return NextResponse.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        console.error('Error fetching post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
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

        await adminDb.collection('posts').doc(postId).update({
            ...(title && { title: title.trim() }),
            ...(content !== undefined && { content: content.trim() }),
            ...(platform && { platform }),
            ...(status && { status }),
            ...(media && { media }),
            updatedAt: new Date(),
        });

        await adminDb.collection('auditLogs').add({
            action: 'POST_UPDATED',
            performedBy: email,
            postId,
            timestamp: new Date(),
        });

        return NextResponse.json({ message: 'Post updated successfully' });
    } catch (error) {
        console.error('Error updating post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;
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

        // Check if post is approved/posted
        const postDoc = await adminDb.collection('posts').doc(postId).get();
        if (postDoc.exists) {
            const postData = postDoc.data();
            if (postData?.status === 'Approved' || postData?.status === 'Posted') {
                return NextResponse.json(
                    { error: 'Cannot delete an approved or posted post' },
                    { status: 403 }
                );
            }
        }

        await adminDb.collection('posts').doc(postId).delete();

        await adminDb.collection('auditLogs').add({
            action: 'POST_DELETED',
            performedBy: email,
            postId,
            timestamp: new Date(),
        });

        return NextResponse.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
