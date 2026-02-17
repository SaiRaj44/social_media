'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    User,
    signInWithPopup,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AUTHORIZED_EMAILS } from '@/lib/constants';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthorized: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAuthorized: false,
    signIn: async () => { },
    signOut: async () => { },
    getIdToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const isAuthorized = user?.email
        ? (AUTHORIZED_EMAILS as readonly string[]).includes(user.email)
        : false;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signIn = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            hd: 'iittp.ac.in',
        });
        try {
            const result = await signInWithPopup(auth, provider);
            if (
                result.user.email &&
                !(AUTHORIZED_EMAILS as readonly string[]).includes(result.user.email)
            ) {
                await firebaseSignOut(auth);
                throw new Error('Unauthorized: Your email is not authorized to access this application.');
            }
        } catch (error) {
            console.error('Sign-in error:', error);
            throw error;
        }
    }, []);

    const signOut = useCallback(async () => {
        await firebaseSignOut(auth);
    }, []);

    const getIdToken = useCallback(async () => {
        if (!user) return null;
        return user.getIdToken();
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, loading, isAuthorized, signIn, signOut, getIdToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
