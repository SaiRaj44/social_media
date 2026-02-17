'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import StorageDashboard from '@/components/media/StorageDashboard';
import { motion } from 'framer-motion';
import { Clock, User, FileText } from 'lucide-react';
import type { AuditLog, Post } from '@/lib/types';

export default function StoragePage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [postsSnap, logsSnap] = await Promise.all([
                    getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'))),
                    getDocs(
                        query(
                            collection(db, 'auditLogs'),
                            orderBy('timestamp', 'desc'),
                            limit(50)
                        )
                    ),
                ]);

                setPosts(
                    postsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Post[]
                );
                setAuditLogs(
                    logsSnap.docs.map((d) => d.data()) as AuditLog[]
                );
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const stats = {
        totalFiles: posts.reduce((s, p) => s + (p.media?.length || 0), 0),
        totalSize: posts.reduce(
            (s, p) => s + (p.media?.reduce((a, m) => a + m.fileSize, 0) || 0),
            0
        ),
        totalPosts: posts.length,
        recentUploads: auditLogs.filter((l) => l.action === 'IMAGE_UPLOADED').length,
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="dashboard-content">
            <div className="page-header">
                <h1>Storage & Audit</h1>
            </div>

            <StorageDashboard stats={stats} />

            {/* Audit Log */}
            <div style={{ marginTop: '2rem' }}>
                <h3 className="section-title">Recent Activity</h3>

                {auditLogs.length === 0 ? (
                    <div className="empty-state">
                        <Clock size={40} />
                        <h3>No activity yet</h3>
                        <p>Upload actions will appear here</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {auditLogs.map((log, idx) => (
                            <motion.div
                                key={idx}
                                className="card"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                style={{ padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
                            >
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 'var(--radius-sm)',
                                        background: log.action.includes('UPLOAD')
                                            ? 'var(--success-light)'
                                            : log.action.includes('DELETE')
                                                ? 'var(--danger-light)'
                                                : 'var(--warning-light)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: log.action.includes('UPLOAD')
                                            ? 'var(--success)'
                                            : log.action.includes('DELETE')
                                                ? 'var(--danger)'
                                                : 'var(--warning)',
                                        flexShrink: 0,
                                    }}
                                >
                                    <FileText size={16} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                        {log.action.replace(/_/g, ' ')}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <User size={12} />
                                            {log.performedBy}
                                        </span>
                                        {log.fileName && (
                                            <span>{log.fileName}</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                    {log.timestamp?.toDate?.()?.toLocaleString() || 'N/A'}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
