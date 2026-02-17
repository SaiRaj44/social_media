'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Replace, ZoomIn } from 'lucide-react';

interface ImageItem {
    id: string;
    previewUrl: string;
    fileName: string;
    fileSize?: number;
    status?: 'uploading' | 'completed' | 'failed';
}

interface ImagePreviewProps {
    images: ImageItem[];
    onRemove: (id: string) => void;
    onReorder: (oldIndex: number, newIndex: number) => void;
    onReplace?: (id: string) => void;
    onPreview: (id: string) => void;
}

function SortableImage({
    image,
    onRemove,
    onReplace,
    onPreview,
}: {
    image: ImageItem;
    onRemove: (id: string) => void;
    onReplace?: (id: string) => void;
    onPreview: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            className={`image-preview-card ${isDragging ? 'dragging' : ''} ${image.status === 'failed' ? 'failed' : ''}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            layout
        >
            <div className="image-preview-thumb" onClick={() => onPreview(image.id)}>
                <img src={image.previewUrl} alt={image.fileName} />
                <div className="image-preview-overlay">
                    <ZoomIn size={20} />
                </div>
            </div>

            <div className="image-preview-info">
                <span className="image-preview-name" title={image.fileName}>
                    {image.fileName.length > 15
                        ? image.fileName.slice(0, 12) + '...'
                        : image.fileName}
                </span>
                {image.fileSize && (
                    <span className="image-preview-size">
                        {(image.fileSize / 1024).toFixed(0)}KB
                    </span>
                )}
            </div>

            <div className="image-preview-actions">
                <button
                    className="icon-btn drag-handle"
                    {...attributes}
                    {...listeners}
                    title="Drag to reorder"
                >
                    <GripVertical size={16} />
                </button>
                {onReplace && (
                    <button
                        className="icon-btn"
                        onClick={() => onReplace(image.id)}
                        title="Replace image"
                    >
                        <Replace size={16} />
                    </button>
                )}
                <button
                    className="icon-btn danger"
                    onClick={() => onRemove(image.id)}
                    title="Remove image"
                >
                    <X size={16} />
                </button>
            </div>
        </motion.div>
    );
}

export default function ImagePreview({
    images,
    onRemove,
    onReorder,
    onReplace,
    onPreview,
}: ImagePreviewProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = images.findIndex((img) => img.id === active.id);
            const newIndex = images.findIndex((img) => img.id === over.id);
            onReorder(oldIndex, newIndex);
        }
    };

    if (images.length === 0) return null;

    return (
        <div className="image-preview-grid-wrapper">
            <h4 className="section-label">
                Uploaded Images ({images.length})
            </h4>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={images} strategy={rectSortingStrategy}>
                    <div className="image-preview-grid">
                        <AnimatePresence>
                            {images.map((image) => (
                                <SortableImage
                                    key={image.id}
                                    image={image}
                                    onRemove={onRemove}
                                    onReplace={onReplace}
                                    onPreview={onPreview}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
