import React, { useMemo, useState } from 'react';
import { Text, TextInput, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { makeloginStyles } from './loginStyles';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export const Login: React.FC = () => {
    const { palette } = useTheme();
    const { signInWithIdentifier, signUpWithEmail, resetPassword, signInWithOAuth } = useAuth();
    const styles = useMemo(() => makeloginStyles(palette), [palette]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [busy, setBusy] = useState(false);
    const [keepSignedIn, setKeepSignedIn] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<'login' | 'signup'>('login');

    const isValidEmail = (v: string) => v.includes('@') && v.includes('.');
    const isValidUsername = (v: string) => v.trim().length >= 3;
    const isValidPassword = (v: string) => v.length >= 8;

    const onSignIn = async () => {
        try {
            setBusy(true);
            if (!(isValidEmail(email) || isValidUsername(email))) throw new Error('Enter email or username (min 3 chars).');
            if (!isValidPassword(password)) throw new Error('Password must be at least 8 characters.');
            await signInWithIdentifier(email.trim(), password);
        } catch (e: any) {
            Alert.alert('Sign in failed', e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    const onSignUp = async () => {
        try {
            setBusy(true);
            if (!username || username.trim().length < 3) throw new Error('Username must be at least 3 characters.');
            if (!isValidEmail(email)) throw new Error('Please enter a valid email.');
            if (!isValidPassword(password)) throw new Error('Password must be at least 8 characters.');
            await signUpWithEmail(email.trim(), password, username.trim());
            Alert.alert('Check your email', 'If email confirmation is required, confirm to complete sign up.');
        } catch (e: any) {
            Alert.alert('Sign up failed', e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    const onForgotPassword = async () => {
        const emailValue = email.trim();
        if (!emailValue) {
            Alert.alert('Enter your email', 'Please enter your email first to receive a reset link.');
            return;
        }
        try {
            setBusy(true);
            await resetPassword(emailValue);
            Alert.alert('Check your email', 'If this email is registered, a reset link has been sent.');
        } catch (e: any) {
            Alert.alert('Reset failed', e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    const onGoogleSignIn = async () => {
        try {
            setBusy(true);
            await signInWithOAuth('google');
        } catch (e: any) {
            Alert.alert('Google sign in failed', e?.message ?? String(e));
            console.error('Google OAuth error:', e);
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={styles.screen}>
            <View style={styles.container}>
                <Text style={styles.title}>{mode === 'login' ? 'Login' : 'Create account'}</Text>
                <Text style={styles.subtitle}>Welcome back to the app</Text>

                <View style={styles.inputWrapper}>
                    <TextInput
                        placeholder="Email Address or Username"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        placeholderTextColor={palette.subText}
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <TextInput
                        placeholder="Password"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        style={styles.input}
                        placeholderTextColor={palette.subText}
                    />
                    <Pressable onPress={() => setShowPassword(v => !v)} style={styles.inputIconBtn} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.subText} />
                    </Pressable>
                </View>

                {/* Sign up-only field */}
                {mode === 'signup' && (
                    <View style={styles.inputWrapper}>
                        <TextInput
                            placeholder="Username"
                            value={username}
                            onChangeText={setUsername}
                            style={styles.input}
                            placeholderTextColor={palette.subText}
                        />
                    </View>
                )}

                <View style={styles.rowBetween}>
                    <Pressable onPress={() => setKeepSignedIn(v => !v)} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked: keepSignedIn }}>
                        <View style={styles.checkbox}>{keepSignedIn && <View style={styles.checkMark} />}</View>
                        <Text style={{ color: palette.text }}>Keep me signed in</Text>
                    </Pressable>
                    {mode === 'login' && (
                        <Pressable onPress={onForgotPassword} disabled={busy} accessibilityRole="button" accessibilityLabel="Forgot password">
                            <Text style={styles.linkText}>Forgot Password?</Text>
                        </Pressable>
                    )}
                </View>

                <Pressable
                    disabled={busy}
                    onPress={mode === 'login' ? onSignIn : onSignUp}
                    style={({ pressed }) => [
                        styles.primaryBtn,
                        { opacity: pressed || busy ? 0.85 : 1 },
                    ]}
                >
                    {busy ? (
                        <ActivityIndicator color={palette.onPrimary} />
                    ) : (
                        <Text style={styles.primaryBtnText}>{mode === 'login' ? 'Login' : 'Create account'}</Text>
                    )}
                </Pressable>

                <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.divider} />
                </View>

                {/* Google Sign In Button */}
                <Pressable
                    onPress={onGoogleSignIn}
                    disabled={busy}
                    style={({ pressed }) => [
                        styles.googleBtn,
                        {
                            opacity: pressed || busy ? 0.9 : 1,
                        }
                    ]}
                >
                    <View style={styles.googleIconWrap}>
                        <Ionicons name="logo-google" size={20} color="#DB4437" />
                    </View>
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                </Pressable>

                <View style={styles.footerRow}>
                    {mode === 'login' ? (
                        <>
                            <Text style={{ color: palette.subText }}>Don't have an account?</Text>
                            <Pressable onPress={() => setMode('signup')} accessibilityRole="button" accessibilityLabel="Create account">
                                <Text style={styles.footerLink}>Create an account</Text>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Text style={{ color: palette.subText }}>Already have an account?</Text>
                            <Pressable onPress={() => setMode('login')} accessibilityRole="button" accessibilityLabel="Back to login">
                                <Text style={styles.footerLink}>Login</Text>
                            </Pressable>
                        </>
                    )}
                </View>
            </View>
        </View>
    );
};

export default Login;