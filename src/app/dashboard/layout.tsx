'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    PlusCircle,
    HardDrive,
    LogOut,
    Sparkles,
} from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, isAuthorized, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && (!user || !isAuthorized)) {
            router.push('/');
        }
    }, [user, loading, isAuthorized, router]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p className="text-muted">Loading...</p>
            </div>
        );
    }

    if (!user || !isAuthorized) return null;

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { href: '/dashboard/posts/new', label: 'New Post', icon: <PlusCircle size={16} /> },
        { href: '/dashboard/storage', label: 'Storage', icon: <HardDrive size={16} /> },
    ];

    return (
        <>
            <nav className="navbar">
                <div className="navbar-inner">
                    <Link href="/dashboard" className="navbar-brand">
                        <div className="navbar-brand-icon">
                            <Sparkles size={18} />
                        </div>
                        SM Manager
                    </Link>

                    <ul className="navbar-nav">
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`navbar-link ${pathname === link.href ? 'active' : ''}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="navbar-user">
                        {user.photoURL && (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || ''}
                                className="navbar-avatar"
                                referrerPolicy="no-referrer"
                            />
                        )}
                        <span className="navbar-user-name">{user.displayName || user.email}</span>
                        <button
                            className="icon-btn"
                            onClick={signOut}
                            title="Sign out"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </nav>
            <main className="container">
                {children}
            </main>
        </>
    );
}
