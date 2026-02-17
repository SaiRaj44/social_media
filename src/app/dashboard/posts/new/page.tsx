'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import UploadZone from '@/components/media/UploadZone';
import ImagePreview from '@/components/media/ImagePreview';
import ProgressBar from '@/components/media/ProgressBar';
import LightboxModal from '@/components/media/LightboxModal';
import { uploadImage } from '@/lib/storage/uploadImage';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send } from 'lucide-react';
import type { MediaItem, UploadProgress } from '@/lib/types';

interface ImageItem {
    id: string;
    file?: File;
    previewUrl: string;
    fileName: string;
    fileSize: number;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    mediaItem?: MediaItem;
}

export default function NewPostPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [platform, setPlatform] = useState<'instagram' | 'twitter' | 'facebook' | 'all'>('all');
    const [images, setImages] = useState<ImageItem[]>([]);
    const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
    const [saving, setSaving] = useState(false);
    const [lightbox, setLightbox] = useState({ open: false, index: 0 });

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
            if (index >= 0) {
                setLightbox({ open: true, index });
            }
        },
        [images]
    );

    const handleSave = async (status: 'Draft' | 'Pending') => {
        if (!title.trim()) {
            toast.error('Please enter a title');
            return;
        }
        if (!user?.email) return;

        setSaving(true);

        try {
            // First create the post to get an ID
            const postRef = await addDoc(collection(db, 'posts'), {
                title: title.trim(),
                content: content.trim(),
                platform,
                status,
                media: [],
                createdBy: user.email,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });

            // Upload images
            const uploadedMedia: MediaItem[] = [];

            for (const image of images) {
                if (image.file) {
                    try {
                        const mediaItem = await uploadImage(image.file, {
                            postId: postRef.id,
                            userEmail: user.email,
                            onProgress: (progress: UploadProgress) => {
                                setUploads((prev) => ({
                                    ...prev,
                                    [image.id]: progress,
                                }));
                                setImages((prev) =>
                                    prev.map((img) =>
                                        img.id === image.id
                                            ? { ...img, status: progress.status === 'completed' ? 'completed' : progress.status === 'failed' ? 'failed' : 'uploading' }
                                            : img
                                    )
                                );
                            },
                        });
                        uploadedMedia.push(mediaItem);
                    } catch (err) {
                        console.error(`Failed to upload ${image.fileName}:`, err);
                        toast.error(`Failed to upload ${image.fileName}`);
                    }
                }
            }

            // Update post with media
            if (uploadedMedia.length > 0) {
                const { updateDoc, doc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'posts', postRef.id), {
                    media: uploadedMedia,
                    updatedAt: Timestamp.now(),
                });
            }

            toast.success(
                status === 'Draft' ? 'Post saved as draft' : 'Post submitted for review'
            );
            router.push('/dashboard');
        } catch (error) {
            console.error('Error saving post:', error);
            toast.error('Failed to save post. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="create-post-page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        className="icon-btn"
                        onClick={() => router.push('/dashboard')}
                        title="Back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1>Create New Post</h1>
                        <p className="text-muted" style={{ marginTop: '0.125rem', fontSize: '0.875rem' }}>
                            Add content and media for your social media post
                        </p>
                    </div>
                </div>
            </div>

            <div className="post-form">
                {/* Title */}
                <div className="form-group">
                    <label className="form-label" htmlFor="post-title">Post Title *</label>
                    <input
                        id="post-title"
                        className="form-input"
                        type="text"
                        placeholder="Enter a descriptive title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={saving}
                    />
                </div>

                {/* Platform & Status */}
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="post-platform">Platform</label>
                        <select
                            id="post-platform"
                            className="form-select"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value as typeof platform)}
                            disabled={saving}
                        >
                            <option value="all">All Platforms</option>
                            <option value="instagram">Instagram</option>
                            <option value="twitter">Twitter</option>
                            <option value="facebook">Facebook</option>
                        </select>
                    </div>
                </div>

                {/* Content */}
                <div className="form-group">
                    <label className="form-label" htmlFor="post-content">Content</label>
                    <textarea
                        id="post-content"
                        className="form-textarea"
                        placeholder="Write your post content..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={saving}
                        rows={4}
                    />
                </div>

                {/* Media Upload */}
                <div className="form-group">
                    <label className="form-label">Media</label>
                    <UploadZone onFilesAccepted={handleFilesAccepted} disabled={saving} />

                    <ProgressBar uploads={uploads} />

                    <ImagePreview
                        images={images.map((img) => ({
                            id: img.id,
                            previewUrl: img.previewUrl,
                            fileName: img.fileName,
                            fileSize: img.fileSize,
                            status: img.status === 'pending' ? undefined : img.status,
                        }))}
                        onRemove={handleRemoveImage}
                        onReorder={handleReorder}
                        onPreview={handlePreview}
                    />
                </div>

                {/* Actions */}
                <div className="form-actions">
                    <motion.button
                        className="btn btn-ghost"
                        onClick={() => handleSave('Draft')}
                        disabled={saving}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Draft'}
                    </motion.button>
                    <motion.button
                        className="btn btn-primary"
                        onClick={() => handleSave('Pending')}
                        disabled={saving}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <Send size={18} />
                        {saving ? 'Submitting...' : 'Submit for Review'}
                    </motion.button>
                </div>
            </div>

            {/* Lightbox */}
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
