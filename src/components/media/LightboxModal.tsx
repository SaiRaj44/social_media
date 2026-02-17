'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface LightboxImage {
    id: string;
    url: string;
    fileName: string;
}

interface LightboxModalProps {
    images: LightboxImage[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (index: number) => void;
}

export default function LightboxModal({
    images,
    currentIndex,
    isOpen,
    onClose,
    onNavigate,
}: LightboxModalProps) {
    const [zoom, setZoom] = React.useState(1);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    if (currentIndex > 0) onNavigate(currentIndex - 1);
                    break;
                case 'ArrowRight':
                    if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
                    break;
            }
        },
        [currentIndex, images.length, onClose, onNavigate]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    useEffect(() => {
        setZoom(1);
    }, [currentIndex]);

    if (!isOpen || images.length === 0) return null;

    const current = images[currentIndex];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="lightbox-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="lightbox-content"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="lightbox-header">
                            <span className="lightbox-title">
                                {current.fileName}
                                <span className="lightbox-counter">
                                    {currentIndex + 1} / {images.length}
                                </span>
                            </span>
                            <div className="lightbox-controls">
                                <button
                                    className="icon-btn"
                                    onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                                    title="Zoom in"
                                >
                                    <ZoomIn size={18} />
                                </button>
                                <button
                                    className="icon-btn"
                                    onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                                    title="Zoom out"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <a
                                    href={current.url}
                                    download={current.fileName}
                                    className="icon-btn"
                                    title="Download"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download size={18} />
                                </a>
                                <button className="icon-btn" onClick={onClose} title="Close">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Image */}
                        <div className="lightbox-image-container">
                            {currentIndex > 0 && (
                                <button
                                    className="lightbox-nav lightbox-nav-prev"
                                    onClick={() => onNavigate(currentIndex - 1)}
                                >
                                    <ChevronLeft size={28} />
                                </button>
                            )}

                            <motion.img
                                key={current.id}
                                src={current.url}
                                alt={current.fileName}
                                className="lightbox-image"
                                style={{ transform: `scale(${zoom})` }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                draggable={false}
                            />

                            {currentIndex < images.length - 1 && (
                                <button
                                    className="lightbox-nav lightbox-nav-next"
                                    onClick={() => onNavigate(currentIndex + 1)}
                                >
                                    <ChevronRight size={28} />
                                </button>
                            )}
                        </div>

                        {/* Thumbnail strip */}
                        {images.length > 1 && (
                            <div className="lightbox-thumbstrip">
                                {images.map((img, idx) => (
                                    <button
                                        key={img.id}
                                        className={`lightbox-thumb ${idx === currentIndex ? 'active' : ''}`}
                                        onClick={() => onNavigate(idx)}
                                    >
                                        <img src={img.url} alt={img.fileName} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
