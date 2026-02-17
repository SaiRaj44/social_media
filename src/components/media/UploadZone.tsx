'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CloudUpload, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { validateFiles } from '@/lib/storage/validateFile';
import { toast } from 'sonner';

interface UploadZoneProps {
    onFilesAccepted: (files: File[]) => void;
    disabled?: boolean;
    maxFiles?: number;
}

export default function UploadZone({ onFilesAccepted, disabled = false, maxFiles = 10 }: UploadZoneProps) {
    const [isDragActive, setIsDragActive] = useState(false);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const { valid, errors } = validateFiles(acceptedFiles);

            errors.forEach((error) => {
                toast.error(error);
            });

            if (valid.length > 0) {
                if (valid.length > maxFiles) {
                    toast.error(`Maximum ${maxFiles} files allowed at once`);
                    onFilesAccepted(valid.slice(0, maxFiles));
                } else {
                    onFilesAccepted(valid);
                }
            }
        },
        [onFilesAccepted, maxFiles]
    );

    const { getRootProps, getInputProps, open } = useDropzone({
        onDrop,
        onDragEnter: () => setIsDragActive(true),
        onDragLeave: () => setIsDragActive(false),
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
        },
        maxSize: 5 * 1024 * 1024,
        disabled,
        noClick: true,
        multiple: true,
    });

    const rootProps = getRootProps();

    return (
        <div
            ref={rootProps.ref}
            role={rootProps.role}
            tabIndex={rootProps.tabIndex}
            onKeyDown={rootProps.onKeyDown}
            onFocus={rootProps.onFocus}
            onBlur={rootProps.onBlur}
            onDragEnter={rootProps.onDragEnter}
            onDragOver={rootProps.onDragOver}
            onDragLeave={rootProps.onDragLeave}
            onDrop={rootProps.onDrop}
            className={`upload-zone ${isDragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        >
            <input {...getInputProps()} />

            <AnimatePresence mode="wait">
                {isDragActive ? (
                    <motion.div
                        key="dropping"
                        className="upload-zone-content"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <CloudUpload size={56} className="upload-icon active" />
                        </motion.div>
                        <h3>Drop your images here</h3>
                        <p className="text-muted">Release to upload</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="idle"
                        className="upload-zone-content"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        >
                            <ImageIcon size={48} className="upload-icon" />
                        </motion.div>
                        <h3>Drag & drop images here</h3>
                        <p className="text-muted">or click the button below to browse</p>
                        <div className="upload-constraints">
                            <span><AlertCircle size={14} /> Max 5MB per file</span>
                            <span><Upload size={14} /> JPG, PNG, WEBP</span>
                        </div>
                        <motion.button
                            type="button"
                            className="btn btn-primary"
                            onClick={open}
                            disabled={disabled}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Upload size={18} />
                            Browse Files
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
