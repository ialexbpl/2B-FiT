import React from 'react';
import { ScrollView, View, Text, Pressable, Switch, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SettingProfileInfo from './SettingProfileInfo';
import { makeSettingStyles } from './SettingStyles';
import { supabase } from '@utils/supabase';
import type { ModalType } from '../../models/ProfileModel';




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
  const [pendingFocusModal, setPendingFocusModal] = React.useState<ModalType | null>(null);
  const [profileInfoOffset, setProfileInfoOffset] = React.useState(0);
  const scrollRef = React.useRef<ScrollView | null>(null);

  const openUsernameModal = React.useCallback(() => {
    setUsernameInput(profile?.username ?? '');
    setUsernameError(null);
    setUsernameModalVisible(true);
  }, [profile?.username]);

  const closeUsernameModal = React.useCallback(() => {
    if (!isUsernameSaving) {
      setUsernameModalVisible(false);
    }
  }, [isUsernameSaving]);

  const handleSaveUsername = React.useCallback(async () => {
    const trimmed = usernameInput.trim();
    if (!session?.user?.id) {
      setUsernameError('You must be signed in.');
      return;
    }
    if (trimmed.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      return;
    }
    setIsUsernameSaving(true);
    setUsernameError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: trimmed })
        .eq('id', session.user.id);
      if (error) {
        throw error;
      }
      await refreshProfile();
      setUsernameModalVisible(false);
      Alert.alert('Username updated', 'Your username has been changed.');
    } catch (err: any) {
      setUsernameError(err?.message ?? 'Failed to update username.');
    } finally {
      setIsUsernameSaving(false);
    }
  }, [refreshProfile, session?.user?.id, usernameInput]);

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

  const handleChangePassword = React.useCallback(() => {
    Alert.alert(
      'Change password',
      'Refresh your password regularly to keep your profile secure.'
    );
  }, []);

  return (//added ImageBackground to test 
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



        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
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
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={handleChangePassword}
                accessibilityRole="button"
                accessibilityLabel="Change password"
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="lock-closed-outline" size={20} color={palette.primary} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Change Password</Text>
                  <Text style={styles.actionSubtitle}>Set a new password to secure your account.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={palette.subText} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
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
          <View
            style={styles.card}
            onLayout={event => setProfileInfoOffset(event.nativeEvent.layout.y)}
          >
            <SettingProfileInfo
              palette={palette}
              layout="inline"
              initialModal={pendingFocusModal}
              onInitialModalHandled={() => setPendingFocusModal(null)}
            />
          </View>
         
        </ScrollView>

        <Modal
          transparent
          animationType="fade"
          visible={usernameModalVisible}
          onRequestClose={closeUsernameModal}
        >
          <View style={styles.usernameModalOverlay}>
            <View style={[styles.usernameModalCard, { backgroundColor: palette.card100, borderColor: palette.border }]}>
              <Text style={styles.usernameModalTitle}>Change username</Text>
              <Text style={styles.usernameModalSubtitle}>Pick a name that represents you in the app.</Text>
              <TextInput
                value={usernameInput}
                onChangeText={setUsernameInput}
                placeholder="Enter new username"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.usernameModalInput, { borderColor: palette.border, color: palette.text }]}
                placeholderTextColor={palette.subText}
              />
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
          </View>
        </Modal>

      </View>
  );
};

export default Setting;
