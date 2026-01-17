import React from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SettingProfileInfo from './SettingProfileInfo';
import { makeSettingStyles } from './SettingStyles';
import { supabase } from '@utils/supabase';
import type { ModalType } from '../../models/ProfileModel';

const USERNAME_MIN = 3;
const USERNAME_MAX = 30;

const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

const PASSWORD_MIN = 8;
const SPECIAL_REGEX = /[^A-Za-z0-9]/;
const UPPER_REGEX = /[A-Z]/;
const LOWER_REGEX = /[a-z]/;
const DIGIT_REGEX = /[0-9]/;

function validateNewPassword(pw: string): string | null {
  if (!pw) return 'Please enter a new password.';
  if (/\s/.test(pw)) return 'Password cannot contain spaces.';
  if (pw.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters long.`;
  if (!UPPER_REGEX.test(pw)) return 'Password must contain at least one uppercase letter (A-Z).';
  if (!LOWER_REGEX.test(pw)) return 'Password must contain at least one lowercase letter (a-z).';
  if (!DIGIT_REGEX.test(pw)) return 'Password must contain at least one number (0-9).';
  if (!SPECIAL_REGEX.test(pw)) return 'Password must contain at least one special character (e.g. !@#$%).';
  return null;
}

export const Setting: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { palette, theme, isDark, toggle } = useTheme();
  const { signOut, profile, session, refreshProfile } = useAuth();
  const styles = React.useMemo(() => makeSettingStyles(palette), [palette]);

  const [usernameModalVisible, setUsernameModalVisible] = React.useState(false);
  const [usernameInput, setUsernameInput] = React.useState(profile?.username ?? '');
  const [usernameError, setUsernameError] = React.useState<string | null>(null);
  const [isUsernameSaving, setIsUsernameSaving] = React.useState(false);

  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = React.useState(false);

  const [pendingFocusModal, setPendingFocusModal] = React.useState<ModalType | null>(null);
  const [profileInfoOffset, setProfileInfoOffset] = React.useState(0);
  const scrollRef = React.useRef<ScrollView | null>(null);

  const openUsernameModal = React.useCallback(() => {
    setUsernameInput(profile?.username ?? '');
    setUsernameError(null);
    setUsernameModalVisible(true);
  }, [profile?.username]);

  const closeUsernameModal = React.useCallback(() => {
    if (!isUsernameSaving) setUsernameModalVisible(false);
  }, [isUsernameSaving]);

  const validateUsername = React.useCallback(
    (value: string) => {
      const trimmed = value.trim();

      if (!session?.user?.id) return 'You must be signed in.';
      if (trimmed.length < USERNAME_MIN) return `Username must be at least ${USERNAME_MIN} characters.`;
      if (trimmed.length > USERNAME_MAX) return `Username must be at most ${USERNAME_MAX} characters.`;
      if (!USERNAME_REGEX.test(trimmed)) {
        return 'Username can contain only letters, numbers, dot, underscore and dash (no spaces).';
      }
      return null;
    },
    [session?.user?.id]
  );

  const handleSaveUsername = React.useCallback(async () => {
    const trimmed = usernameInput.trim();
    const validationError = validateUsername(trimmed);

    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    setIsUsernameSaving(true);
    setUsernameError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: trimmed })
        .eq('id', session!.user.id);

      if (error) throw error;

      await refreshProfile();
      setUsernameModalVisible(false);
      Alert.alert('Username updated', 'Your username has been changed.');
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to update username.';
      if (String(msg).toLowerCase().includes('value too long')) {
        setUsernameError(`Username is too long. Max is ${USERNAME_MAX} characters.`);
      } else {
        setUsernameError(msg);
      }
    } finally {
      setIsUsernameSaving(false);
    }
  }, [refreshProfile, session, usernameInput, validateUsername]);

  const openPasswordModal = React.useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError(null);
    setPasswordModalVisible(true);
  }, []);

  const closePasswordModal = React.useCallback(() => {
    if (!isPasswordSaving) setPasswordModalVisible(false);
  }, [isPasswordSaving]);

  const validatePasswords = React.useCallback(() => {
    if (!session?.user?.email) return 'No email found for this account.';
    if (!currentPassword) return 'Please enter your current password.';

    const pwError = validateNewPassword(newPassword);
    if (pwError) return pwError;

    if (!confirmNewPassword) return 'Please confirm your new password.';
    if (newPassword !== confirmNewPassword) return 'New password and confirmation do not match.';
    if (newPassword === currentPassword) return 'New password must be different from current password.';

    return null;
  }, [confirmNewPassword, currentPassword, newPassword, session?.user?.email]);

  const handleChangePasswordInApp = React.useCallback(async () => {
    const validationError = validatePasswords();
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    const email = session!.user.email!;
    setIsPasswordSaving(true);
    setPasswordError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) throw signInError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setPasswordModalVisible(false);
      Alert.alert('Password updated', 'Your password has been changed successfully.');
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to change password.';
      if (String(msg).toLowerCase().includes('invalid login credentials')) {
        setPasswordError('Current password is incorrect.');
      } else {
        setPasswordError(msg);
      }
    } finally {
      setIsPasswordSaving(false);
    }
  }, [currentPassword, newPassword, session, validatePasswords]);

  const focusModalParam = route?.params?.focusModal as ModalType | undefined;

  React.useEffect(() => {
    if (focusModalParam) {
      setPendingFocusModal(focusModalParam);
      setTimeout(() => {
        const y = Math.max(profileInfoOffset - 16, 0);
        scrollRef.current?.scrollTo({ y, animated: true });
      }, 60);
      (navigation as any)?.setParams?.({ focusModal: undefined });
    }
  }, [focusModalParam, navigation, profileInfoOffset]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => (navigation as any).navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flexShrink: 1, paddingRight: 12 }}>
              <Text style={styles.cardTitle}>Dark mode</Text>
              <Text style={styles.cardSubtitle}>Customize app appearance.</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              thumbColor={'#ffffff'}
              trackColor={{ false: '#d1d5db', true: theme.colors.primary }}
            />
          </View>
        </View>

        <View style={styles.sectionSpacer} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account & Security</Text>
          <Text style={styles.cardSubtitle}>Manage your credentials with quick shortcuts.</Text>

          <View style={styles.actionButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionButtonFirst,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={openUsernameModal}
              accessibilityRole="button"
              accessibilityLabel="Change login"
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="id-card-outline" size={20} color={palette.primary} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>Change Login</Text>
                <Text style={styles.actionSubtitle}>Update the username used to sign in.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.subText} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              onPress={openPasswordModal}
              accessibilityRole="button"
              accessibilityLabel="Change password"
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="lock-closed-outline" size={20} color={palette.primary} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>Change Password</Text>
                <Text style={styles.actionSubtitle}>Change it directly in the app.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.subText} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              onPress={async () => {
                try {
                  await signOut();
                } catch (e: any) {
                  Alert.alert('Sign out failed', e?.message ?? String(e));
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="log-out-outline" size={20} color={palette.primary} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>Sign Out</Text>
                <Text style={styles.actionSubtitle}>Sign out of your account.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.subText} />
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionSpacer} />

        <View style={styles.card} onLayout={event => setProfileInfoOffset(event.nativeEvent.layout.y)}>
          <SettingProfileInfo
            palette={palette}
            layout="inline"
            initialModal={pendingFocusModal}
            onInitialModalHandled={() => setPendingFocusModal(null)}
          />
        </View>
      </ScrollView>

      <Modal transparent animationType="fade" visible={usernameModalVisible} onRequestClose={closeUsernameModal}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.usernameModalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
              <View style={[styles.usernameModalCard, { backgroundColor: palette.card100, borderColor: palette.border }]}>
                <Text style={styles.usernameModalTitle}>Change username</Text>
                <Text style={styles.usernameModalSubtitle}>Pick a name that represents you in the app.</Text>

                <TextInput
                  value={usernameInput}
                  onChangeText={(txt) => {
                    if (txt.length <= USERNAME_MAX) setUsernameInput(txt);
                  }}
                  placeholder="Enter new username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={USERNAME_MAX}
                  style={[styles.usernameModalInput, { borderColor: palette.border, color: palette.text }]}
                  placeholderTextColor={palette.subText}
                />

                <Text style={{ color: palette.subText, marginTop: 6, fontSize: 12 }}>
                  {usernameInput.trim().length}/{USERNAME_MAX}
                </Text>

                {usernameError ? <Text style={styles.usernameModalError}>{usernameError}</Text> : null}

                <View style={styles.usernameModalActions}>
                  <Pressable
                    style={[styles.usernameModalButton, { borderColor: palette.border }]}
                    onPress={closeUsernameModal}
                    disabled={isUsernameSaving}
                  >
                    <Text style={[styles.usernameModalButtonText, { color: palette.text }]}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.usernameModalButton, styles.usernameModalPrimaryButton]}
                    onPress={handleSaveUsername}
                    disabled={isUsernameSaving}
                  >
                    {isUsernameSaving ? (
                      <ActivityIndicator color={palette.onPrimary} />
                    ) : (
                      <Text style={styles.usernameModalPrimaryText}>Save</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal transparent animationType="fade" visible={passwordModalVisible} onRequestClose={closePasswordModal}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.usernameModalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
              <View style={[styles.usernameModalCard, { backgroundColor: palette.card100, borderColor: palette.border }]}>
                <Text style={styles.usernameModalTitle}>Change password</Text>

                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Current password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.usernameModalInput, { borderColor: palette.border, color: palette.text }]}
                  placeholderTextColor={palette.subText}
                />

                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.usernameModalInput, { borderColor: palette.border, color: palette.text, marginTop: 10 }]}
                  placeholderTextColor={palette.subText}
                />

                <TextInput
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  placeholder="Confirm new password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.usernameModalInput, { borderColor: palette.border, color: palette.text, marginTop: 10 }]}
                  placeholderTextColor={palette.subText}
                />

                {passwordError ? <Text style={styles.usernameModalError}>{passwordError}</Text> : null}

                <View style={styles.usernameModalActions}>
                  <Pressable
                    style={[styles.usernameModalButton, { borderColor: palette.border }]}
                    onPress={closePasswordModal}
                    disabled={isPasswordSaving}
                  >
                    <Text style={[styles.usernameModalButtonText, { color: palette.text }]}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.usernameModalButton, styles.usernameModalPrimaryButton]}
                    onPress={handleChangePasswordInApp}
                    disabled={isPasswordSaving}
                  >
                    {isPasswordSaving ? (
                      <ActivityIndicator color={palette.onPrimary} />
                    ) : (
                      <Text style={styles.usernameModalPrimaryText}>Save</Text>
                    )}
                  </Pressable>
                </View>

              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default Setting;
