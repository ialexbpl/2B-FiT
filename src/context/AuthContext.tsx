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

// FUNKCJA NAPRAWAJĄCA BRAKUJĄCE PROFILE
const ensureProfileExists = async (userId: string): Promise<ProfileRow | null> => {
    try {
        // Najpierw sprawdź czy profil istnieje
        const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, updated_at')
            .eq('id', userId)
            .single();

        // Jeśli profil istnieje - zwróć go
        if (existingProfile) {
            return existingProfile;
        }

        // Jeśli brak profilu (błąd PGRST116) - stwórz nowy
        if (checkError && checkError.code === 'PGRST116') {
            console.log('Creating missing profile for user:', userId);
            
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([
                    { 
                        id: userId, 
                        username: `user_${userId.slice(0, 8)}`,
                        full_name: 'User',
                        avatar_url: null
                    }
                ])
                .select('id, username, full_name, avatar_url, updated_at')
                .single();

            if (createError) {
                console.error('Error creating profile:', createError);
                return null;
            }

            console.log('Profile created successfully');
            return newProfile;
        }

        // Inny błąd
        console.error('Error checking profile:', checkError);
        return null;
    } catch (error) {
        console.error('Error in ensureProfileExists:', error);
        return null;
    }
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

    const refreshProfile = useCallback(async () => {
        const userId = session?.user?.id;
        if (!userId) {
            setProfile(null);
            return;
        }
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
    }, [session?.user?.id]);

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
        
        // Dla username - znajdź email w profilu
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', trimmed)
            .maybeSingle();
            
        if (error) throw error;
        if (!data) {
            throw new Error('Username not found');
        }
        
        // Użyj bezpośrednio signInWithEmail z domyślnym emailem
        // (lub zmień logikę w zależności od struktury Twojej bazy)
        throw new Error('Please sign in with your email address');
    };

    const signUpWithEmail = async (email: string, password: string, username?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: username ? { data: { username } } : undefined,
        });
        if (error) throw error;
        
        // Profil zostanie stworzony automatycznie przez trigger w bazie
        // lub przez ensureProfileExists
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
            throw new Error('OAuth URL not returned');
        }

        if (Platform.OS === 'web') {
            window.location.assign(data.url);
            return;
        }

        const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (authResult.type === 'success' && authResult.url) {
            const url = new URL(authResult.url);
            const params = new URLSearchParams(url.hash.slice(1));
            
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken && refreshToken) {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                if (sessionError) throw sessionError;
            } else {
                throw new Error('OAuth redirect missing tokens');
            }
        } else if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
            return;
        } else {
            throw new Error('Authentication failed');
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