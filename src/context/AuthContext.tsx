import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@utils/supabase';
import { profileCache } from '@utils/db';
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

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
    refreshProfile: () => Promise<void>;
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
    refreshProfile: async () => { },
    signInWithIdentifier: async () => { },
    signInWithEmail: async () => { },
    signUpWithEmail: async () => { },
    resetPassword: async () => { },
    signInWithOAuth: async () => { },
    sendPhoneOtp: async () => { },
    signOut: async () => { },
});

const resolveRedirectUrl = () => {
    const envRedirect = process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL;
    if (envRedirect && envRedirect.length > 0) {
        return envRedirect;
    }
    if (Platform.OS === 'web') {
        const webRedirect = process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL_WEB;
        if (webRedirect && webRedirect.length > 0) {
            return webRedirect;
        }
    }
    return makeRedirectUri({
        scheme: 'to-be-fit',
        path: 'auth-callback',
        preferLocalhost: false,
        native: 'to-be-fit://auth-callback',
    });
};

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

    // Ensure a profile row exists for the current auth user (useful for OAuth like Google)
    const ensureProfile = useCallback(
        async (u: Session['user']) => {
            if (!u?.id) return;
            const { data, error } = await supabase.from('profiles').select('id').eq('id', u.id).maybeSingle();
            if (error) {
                console.error('ensureProfile select error', error);
                return;
            }
            if (data) return; // already exists

            const username =
                (u.user_metadata as any)?.username ||
                (u.user_metadata as any)?.preferred_username ||
                (u.user_metadata as any)?.name ||
                (u.email ? u.email.split('@')[0] : `user_${u.id.slice(0, 8)}`);

            const full_name =
                (u.user_metadata as any)?.name ||
                (u.user_metadata as any)?.full_name ||
                u.email ||
                username;

            const avatar_url =
                (u.user_metadata as any)?.picture ||
                (u.user_metadata as any)?.avatar_url ||
                null;

            const { error: insertErr } = await supabase.from('profiles').insert({
                id: u.id,
                username,
                full_name,
                avatar_url,
            });
            if (insertErr) {
                console.error('ensureProfile insert error', insertErr);
            }
        },
        []
    );

    const refreshProfile = useCallback(async () => {
        const userId = session?.user?.id;
        if (!userId) {
            setProfile(null);
            return;
        }
        // Make sure a profile row exists (handles Google/OAuth users without a profile)
        await ensureProfile(session.user);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        setProfile(data ?? null);
        try {
            if (data) {
                await profileCache.upsert({ ...data, id: data.id });
            }
        } catch (e) {
            console.warn('sqlite upsert failed', e);
        }
    }, [session?.user?.id, ensureProfile]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            try {
                await refreshProfile();
            } catch (error) {
                console.error('profile fetch error', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [refreshProfile]);

    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signInWithIdentifier = async (identifier: string, password: string) => {
        const trimmed = identifier.trim();
        if (trimmed.includes('@')) {
            return signInWithEmail(trimmed, password);
        }
        throw new Error('Sign in with email is required (profiles table has no email column).');
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
            await supabase.from('profiles').update({ username }).eq('id', newSession.user.id);
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const resetPassword = async (email: string) => {
        const redirectTo = resolveRedirectUrl();
        const { error } = await supabase.auth.resetPasswordForEmail(
            email,
            redirectTo ? { redirectTo } : undefined
        );
        if (error) throw error;
    };

    const signInWithOAuth = async (provider: 'google') => {
        const redirectTo = resolveRedirectUrl();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo,
                skipBrowserRedirect: Platform.OS === 'web',
            },
        });
        if (error) throw error;

        if (!data?.url) {
            throw new Error('OAuth URL not returned. Check provider configuration.');
        }

        if (Platform.OS === 'web') {
            window.location.assign(data.url);
            return;
        }

        const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (authResult.type === 'success' && authResult.url) {
            const params: Record<string, string> = {};
            const collect = (raw: string | undefined) => {
                if (!raw) return;
                raw.split('&').forEach((pair) => {
                    if (!pair) return;
                    const [rawKey, rawValue = ''] = pair.split('=');
                    if (!rawKey) return;
                    const key = decodeURIComponent(rawKey);
                    if (key in params) return;
                    params[key] = decodeURIComponent(rawValue);
                });
            };

            const queryIndex = authResult.url.indexOf('?');
            if (queryIndex >= 0) {
                const hashIndex = authResult.url.indexOf('#', queryIndex);
                collect(authResult.url.slice(
                    queryIndex + 1,
                    hashIndex >= 0 ? hashIndex : undefined
                ));
            }
            const hashIndex = authResult.url.indexOf('#');
            if (hashIndex >= 0) {
                collect(authResult.url.slice(hashIndex + 1));
            }

            const accessToken = params['access_token'];
            const refreshToken = params['refresh_token'];
            if (accessToken && refreshToken) {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                if (sessionError) throw sessionError;
            } else {
                const authCode = params['code'];
                if (!authCode) {
                    throw new Error('OAuth redirect missing tokens. Check Supabase configuration.');
                }
                const { error: sessionError } = await supabase.auth.exchangeCodeForSession(authCode);
                if (sessionError) throw sessionError;
            }
        } else if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
            return;
        } else if (authResult.type === 'locked') {
            throw new Error('Authentication session locked. Try again.');
        }
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
            refreshProfile,
            signInWithIdentifier,
            signInWithEmail,
            signUpWithEmail,
            resetPassword,
            signInWithOAuth,
            sendPhoneOtp,
            signOut,
        }),
        [session, profile, isLoading, refreshProfile]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
