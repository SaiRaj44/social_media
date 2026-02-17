'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { UploadProgress as UploadProgressType } from '@/lib/types';

interface ProgressBarProps {
    uploads: Record<string, UploadProgressType>;
}

function SingleProgressBar({ upload }: { upload: UploadProgressType }) {
    const statusIcon = {
        uploading: <Loader2 size={16} className="spin" />,
        completed: <CheckCircle size={16} className="text-success" />,
        failed: <XCircle size={16} className="text-danger" />,
    };

    const statusColor = {
        uploading: 'var(--primary)',
        completed: 'var(--success)',
        failed: 'var(--danger)',
    };

    return (
        <motion.div
            className="progress-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
        >
            <div className="progress-item-header">
                <div className="progress-item-info">
                    {statusIcon[upload.status]}
                    <span className="progress-file-name">
                        {upload.fileName.length > 25
                            ? upload.fileName.slice(0, 22) + '...'
                            : upload.fileName}
                    </span>
                </div>
                <span className="progress-percent">
                    {upload.status === 'completed'
                        ? 'Done'
                        : upload.status === 'failed'
                            ? 'Failed'
                            : `${Math.round(upload.progress)}%`}
                </span>
            </div>

            <div className="progress-bar-track">
                <motion.div
                    className="progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${upload.progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ backgroundColor: statusColor[upload.status] }}
                />
            </div>

            {upload.error && (
                <p className="progress-error">{upload.error}</p>
            )}
        </motion.div>
    );
}

export default function ProgressBar({ uploads }: ProgressBarProps) {
    const entries = Object.entries(uploads);
    if (entries.length === 0) return null;

    const completed = entries.filter(([, u]) => u.status === 'completed').length;
    const total = entries.length;

    return (
        <div className="progress-container">
            <div className="progress-header">
                <h4 className="section-label">Upload Progress</h4>
                <span className="progress-summary">
                    {completed}/{total} completed
                </span>
            </div>
            <div className="progress-list">
                {entries.map(([key, upload]) => (
                    <SingleProgressBar key={key} upload={upload} />
                ))}
            </div>
        </div>
    );
}
