'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { collection, query, orderBy, getDocs, deleteDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import StorageDashboard from '@/components/media/StorageDashboard';
import {
    PlusCircle,
    Image as ImageIcon,
    Calendar,
    FileText,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Post } from '@/lib/types';

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPosts() {
            try {
                const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const postData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Post[];
                setPosts(postData);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, []);

    const handleDeletePost = async (e: React.MouseEvent, postId: string, postTitle: string) => {
        e.stopPropagation(); // Prevent navigating to edit page
        if (!confirm(`Delete "${postTitle}"? This cannot be undone.`)) return;
        if (!user?.email) return;

        try {
            await deleteDoc(doc(db, 'posts', postId));
            await addDoc(collection(db, 'auditLogs'), {
                action: 'POST_DELETED',
                performedBy: user.email,
                postId,
                timestamp: Timestamp.now(),
            });
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            toast.success('Post deleted');
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Failed to delete post');
        }
    };

    const stats = {
        totalFiles: posts.reduce((sum, p) => sum + (p.media?.length || 0), 0),
        totalSize: posts.reduce(
            (sum, p) => sum + (p.media?.reduce((s, m) => s + m.fileSize, 0) || 0),
            0
        ),
        totalPosts: posts.length,
        recentUploads: posts
            .filter((p) => {
                const created = p.createdAt?.toDate?.();
                if (!created) return false;
                const dayAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return created > dayAgo;
            })
            .reduce((sum, p) => sum + (p.media?.length || 0), 0),
    };

    return (
        <div className="dashboard-content">
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="text-muted" style={{ marginTop: '0.25rem' }}>
                        Welcome back, {user?.displayName?.split(' ')[0] || 'User'}
                    </p>
                </div>
                <motion.button
                    className="btn btn-primary btn-lg"
                    onClick={() => router.push('/dashboard/posts/new')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <PlusCircle size={20} />
                    Create Post
                </motion.button>
            </div>

            <StorageDashboard stats={stats} />

            <div style={{ marginTop: '2rem' }}>
                <h3 className="section-title">Recent Posts</h3>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <div className="loading-spinner" />
                    </div>
                ) : posts.length === 0 ? (
                    <motion.div
                        className="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <FileText size={48} />
                        <h3>No posts yet</h3>
                        <p>Create your first social media post to get started</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => router.push('/dashboard/posts/new')}
                        >
                            <PlusCircle size={18} />
                            Create First Post
                        </button>
                    </motion.div>
                ) : (
                    <div className="posts-grid">
                        {posts.map((post, idx) => (
                            <motion.div
                                key={post.id}
                                className="post-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => router.push(`/dashboard/posts/${post.id}`)}
                                style={{ position: 'relative' }}
                            >
                                {/* Delete button for non-locked posts */}
                                {post.status !== 'Approved' && post.status !== 'Posted' && (
                                    <motion.button
                                        className="icon-btn"
                                        onClick={(e) => handleDeletePost(e, post.id!, post.title)}
                                        title="Delete post"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        style={{
                                            position: 'absolute',
                                            top: '0.5rem',
                                            right: '0.5rem',
                                            zIndex: 2,
                                            background: 'rgba(239, 68, 68, 0.15)',
                                            color: 'var(--danger, #ef4444)',
                                            borderRadius: '0.5rem',
                                            padding: '0.375rem',
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </motion.button>
                                )}
                                <div className="post-card-media">
                                    {post.media?.[0]?.thumbnailUrl ? (
                                        <img
                                            src={post.media[0].thumbnailUrl}
                                            alt={post.title}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="post-card-media-placeholder">
                                            <ImageIcon size={32} />
                                            <span>No media</span>
                                        </div>
                                    )}
                                </div>
                                <div className="post-card-body">
                                    <h4 className="post-card-title">{post.title}</h4>
                                    <p className="post-card-desc">{post.content}</p>
                                    <div className="post-card-footer">
                                        <div className="post-card-meta">
                                            <span>
                                                <ImageIcon size={13} />
                                                {post.media?.length || 0}
                                            </span>
                                            <span>
                                                <Calendar size={13} />
                                                {post.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                            </span>
                                        </div>
                                        <span className={`status-badge ${post.status?.toLowerCase()}`}>
                                            {post.status}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

