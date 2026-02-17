'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    doc,
    getDoc,
    updateDoc,
    Timestamp,
    deleteDoc,
    collection,
    addDoc,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import UploadZone from '@/components/media/UploadZone';
import ImagePreview from '@/components/media/ImagePreview';
import ProgressBar from '@/components/media/ProgressBar';
import LightboxModal from '@/components/media/LightboxModal';
import { uploadImage } from '@/lib/storage/uploadImage';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Save,
    Trash2,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import type { Post, MediaItem, UploadProgress } from '@/lib/types';

interface ImageItem {
    id: string;
    file?: File;
    previewUrl: string;
    fileName: string;
    fileSize: number;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    mediaItem?: MediaItem;
    isExisting?: boolean;
}

export default function EditPostPage({ params }: { params: Promise<{ postId: string }> }) {
    const { postId } = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [post, setPost] = useState<Post | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [platform, setPlatform] = useState<'instagram' | 'twitter' | 'facebook' | 'all'>('all');
    const [status, setStatus] = useState<Post['status']>('Draft');
    const [images, setImages] = useState<ImageItem[]>([]);
    const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lightbox, setLightbox] = useState({ open: false, index: 0 });

    useEffect(() => {
        async function fetchPost() {
            try {
                const docSnap = await getDoc(doc(db, 'posts', postId));
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Post;
                    setPost(data);
                    setTitle(data.title);
                    setContent(data.content);
                    setPlatform(data.platform);
                    setStatus(data.status);

                    // Load existing media
                    const existingImages: ImageItem[] = (data.media || []).map(
                        (m: MediaItem, idx: number) => ({
                            id: `existing-${idx}`,
                            previewUrl: m.thumbnailUrl || m.fileUrl,
                            fileName: m.fileName,
                            fileSize: m.fileSize,
                            status: 'completed' as const,
                            mediaItem: m,
                            isExisting: true,
                        })
                    );
                    setImages(existingImages);
                } else {
                    toast.error('Post not found');
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('Error fetching post:', error);
                toast.error('Failed to load post');
            } finally {
                setLoading(false);
            }
        }

        fetchPost();
    }, [postId, router]);

    const handleFilesAccepted = useCallback((files: File[]) => {
        const newImages: ImageItem[] = files.map((file) => ({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            file,
            previewUrl: URL.createObjectURL(file),
            fileName: file.name,
            fileSize: file.size,
            status: 'pending' as const,
        }));
        setImages((prev) => [...prev, ...newImages]);
        toast.success(`${files.length} image(s) added`);
    }, []);

    const handleRemoveImage = useCallback((id: string) => {
        setImages((prev) => {
            const img = prev.find((i) => i.id === id);
            if (img?.previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(img.previewUrl);
            }
            return prev.filter((i) => i.id !== id);
        });
    }, []);

    const handleReorder = useCallback((oldIndex: number, newIndex: number) => {
        setImages((prev) => {
            const newArr = [...prev];
            const [moved] = newArr.splice(oldIndex, 1);
            newArr.splice(newIndex, 0, moved);
            return newArr;
        });
    }, []);

    const handlePreview = useCallback(
        (id: string) => {
            const index = images.findIndex((img) => img.id === id);
            if (index >= 0) setLightbox({ open: true, index });
        },
        [images]
    );

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title');
            return;
        }
        if (!user?.email) return;

        setSaving(true);

        try {
            // Upload new images
            const allMedia: MediaItem[] = [];
            for (const image of images) {
                if (image.isExisting && image.mediaItem) {
                    allMedia.push(image.mediaItem);
                } else if (image.file) {
                    try {
                        const mediaItem = await uploadImage(image.file, {
                            postId,
                            userEmail: user.email,
                            onProgress: (progress: UploadProgress) => {
                                setUploads((prev) => ({ ...prev, [image.id]: progress }));
                            },
                        });
                        allMedia.push(mediaItem);
                    } catch (err) {
                        console.error(`Failed to upload ${image.fileName}:`, err);
                        toast.error(`Failed to upload ${image.fileName}`);
                    }
                }
            }

            await updateDoc(doc(db, 'posts', postId), {
                title: title.trim(),
                content: content.trim(),
                platform,
                status,
                media: allMedia,
                updatedAt: Timestamp.now(),
            });

            // Audit log
            await addDoc(collection(db, 'auditLogs'), {
                action: 'POST_UPDATED',
                performedBy: user.email,
                postId,
                timestamp: Timestamp.now(),
            });

            toast.success('Post updated successfully');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error updating post:', error);
            toast.error('Failed to update post');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        if (!user?.email) return;

        try {
            await deleteDoc(doc(db, 'posts', postId));
            await addDoc(collection(db, 'auditLogs'), {
                action: 'POST_DELETED',
                performedBy: user.email,
                postId,
                timestamp: Timestamp.now(),
            });
            toast.success('Post deleted');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Failed to delete post');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    const isLocked = status === 'Approved' || status === 'Posted';

    return (
        <div className="create-post-page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        className="icon-btn"
                        onClick={() => router.push('/dashboard')}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1>Edit Post</h1>
                        <p className="text-muted" style={{ marginTop: '0.125rem', fontSize: '0.875rem' }}>
                            {isLocked
                                ? 'This post is locked (Approved/Posted)'
                                : 'Edit content and manage media'}
                        </p>
                    </div>
                </div>
                <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>
            </div>

            <div className="post-form">
                <div className="form-group">
                    <label className="form-label" htmlFor="edit-title">Post Title *</label>
                    <input
                        id="edit-title"
                        className="form-input"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={saving || isLocked}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="edit-platform">Platform</label>
                        <select
                            id="edit-platform"
                            className="form-select"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value as typeof platform)}
                            disabled={saving || isLocked}
                        >
                            <option value="all">All Platforms</option>
                            <option value="instagram">Instagram</option>
                            <option value="twitter">Twitter</option>
                            <option value="facebook">Facebook</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="edit-status">Status</label>
                        <select
                            id="edit-status"
                            className="form-select"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Post['status'])}
                            disabled={saving}
                        >
                            <option value="Draft">Draft</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Posted">Posted</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="edit-content">Content</label>
                    <textarea
                        id="edit-content"
                        className="form-textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={saving || isLocked}
                        rows={4}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Media</label>
                    {!isLocked && (
                        <UploadZone onFilesAccepted={handleFilesAccepted} disabled={saving} />
                    )}

                    <ProgressBar uploads={uploads} />

                    <ImagePreview
                        images={images.map((img) => ({
                            id: img.id,
                            previewUrl: img.previewUrl,
                            fileName: img.fileName,
                            fileSize: img.fileSize,
                        }))}
                        onRemove={handleRemoveImage}
                        onReorder={handleReorder}
                        onPreview={handlePreview}
                    />
                </div>

                <div className="form-actions">
                    <motion.button
                        className="btn btn-danger"
                        onClick={handleDelete}
                        disabled={saving}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Trash2 size={18} />
                        Delete
                    </motion.button>
                    <div style={{ flex: 1 }} />
                    <motion.button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                </div>
            </div>

            <LightboxModal
                images={images.map((img) => ({
                    id: img.id,
                    url: img.previewUrl,
                    fileName: img.fileName,
                }))}
                currentIndex={lightbox.index}
                isOpen={lightbox.open}
                onClose={() => setLightbox({ ...lightbox, open: false })}
                onNavigate={(index) => setLightbox({ ...lightbox, index })}
            />
        </div>
    );
}
