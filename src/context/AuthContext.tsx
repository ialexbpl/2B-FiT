import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@utils/supabase';
import { profileCache } from '@utils/db';

type ProfileRow = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    website: string | null;
    updated_at: string | null;
};

type AuthValue = {
    session: Session | null | undefined;
    profile: ProfileRow | null | undefined;
    isLoading: boolean;
    isLoggedIn: boolean;
    signInWithIdentifier: (identifier: string, password: string) => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, username?: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    signInWithOAuth: (provider: 'google') => Promise<void>;
    sendPhoneOtp: (phone: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
    session: undefined,
    profile: undefined,
    isLoading: true,
    isLoggedIn: false,
    signInWithIdentifier: async () => { },
    signInWithEmail: async () => { },
    signUpWithEmail: async () => { },
    resetPassword: async () => { },
    signInWithOAuth: async () => { },
    sendPhoneOtp: async () => { },
    signOut: async () => { },
});

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [profile, setProfile] = useState<ProfileRow | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setIsLoading(true);
            const { data, error } = await supabase.auth.getSession();
            if (mounted) {
                if (error) console.error('getSession error', error);
                setSession(data.session ?? null);
                setIsLoading(false);
            }
        })();
        const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
        });
        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setIsLoading(true);
            if (session?.user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                if (error) console.error('profile fetch error', error);
                if (mounted) setProfile(data ?? null);
                try {
                    if (session?.user && data) {
                        await profileCache.upsert({ ...data, id: data.id });
                    }
                } catch (e) {
                    console.warn('sqlite upsert failed', e);
                }
            } else {
                if (mounted) setProfile(null);
            }
            setIsLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [session?.user?.id]);

    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signInWithIdentifier = async (identifier: string, password: string) => {
        const trimmed = identifier.trim();
        if (trimmed.includes('@')) {
            return signInWithEmail(trimmed, password);
        }
        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', trimmed)
            .maybeSingle();
        if (error) throw error;
        const email = (data as any)?.email as string | undefined;
        if (!email) {
            throw new Error('Username not found or profile email missing. Please sign in with email or update schema to include email in profiles.');
        }
        return signInWithEmail(email, password);
    };

    const signUpWithEmail = async (email: string, password: string, username?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: username ? { data: { username } } : undefined,
        });
        if (error) throw error;
        const newSession = data?.session ?? (await supabase.auth.getSession()).data.session;
        if (username && newSession?.user?.id) {
            await supabase.from('profiles').update({ username, email: newSession.user.email }).eq('id', newSession.user.id);
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const resetPassword = async (email: string) => {
        const redirectTo = process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL;
        const { error } = await supabase.auth.resetPasswordForEmail(
            email,
            redirectTo ? { redirectTo } : undefined
        );
        if (error) throw error;
    };

    const signInWithOAuth = async (provider: 'google') => {
        const redirectTo = process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL;
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: redirectTo ? { redirectTo } : undefined,
        });
        if (error) throw error;
    };

    const sendPhoneOtp = async (phone: string) => {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
    };

    const value = useMemo<AuthValue>(
        () => ({
            session,
            profile,
            isLoading,
            isLoggedIn: !!session,
            signInWithIdentifier,
            signInWithEmail,
            signUpWithEmail,
            resetPassword,
            signInWithOAuth,
            sendPhoneOtp,
            signOut,
        }),
        [session, profile, isLoading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);