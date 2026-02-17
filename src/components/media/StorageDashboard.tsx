'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Image, FileText, TrendingUp } from 'lucide-react';

interface StorageStats {
    totalFiles: number;
    totalSize: number;
    totalPosts: number;
    recentUploads: number;
}

interface StorageDashboardProps {
    stats: StorageStats;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function StorageDashboard({ stats }: StorageDashboardProps) {
    const cards = [
        {
            icon: <Image size={24} />,
            label: 'Total Images',
            value: stats.totalFiles.toString(),
            color: 'var(--primary)',
        },
        {
            icon: <HardDrive size={24} />,
            label: 'Storage Used',
            value: formatBytes(stats.totalSize),
            color: 'var(--accent)',
        },
        {
            icon: <FileText size={24} />,
            label: 'Total Posts',
            value: stats.totalPosts.toString(),
            color: 'var(--success)',
        },
        {
            icon: <TrendingUp size={24} />,
            label: 'Recent Uploads',
            value: stats.recentUploads.toString(),
            color: 'var(--warning)',
        },
    ];

    return (
        <div className="storage-dashboard">
            <h3 className="section-title">Local Storage Overview</h3>
            <div className="stats-grid">
                {cards.map((card, idx) => (
                    <motion.div
                        key={card.label}
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <div className="stat-icon" style={{ color: card.color }}>
                            {card.icon}
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{card.value}</span>
                            <span className="stat-label">{card.label}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Storage usage bar */}
            <div className="storage-usage-section">
                <div className="storage-usage-header">
                    <span>Storage Usage</span>
                    <span>{formatBytes(stats.totalSize)} / 5 GB</span>
                </div>
                <div className="storage-usage-bar">
                    <motion.div
                        className="storage-usage-fill"
                        initial={{ width: 0 }}
                        animate={{
                            width: `${Math.min((stats.totalSize / (5 * 1024 * 1024 * 1024)) * 100, 100)}%`,
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </div>
            </div>
        </div>
    );
}
