import React from "react";
import {
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from 'expo-image-picker';
import { makeProfileStyles } from "./ProfileStyles";
// theme palettes are provided via ThemeContext
import { ProfileAchivment } from "./ProfileAchivment";
import { FriendsPanel } from "./FriendsPanel";
import { useTheme } from "../../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { useProfile } from "../../context/ProfileContext";
import { useAuth } from "@context/AuthContext";
import { supabase } from "@utils/supabase";
import type { ModalType } from "@models/ProfileModel";

const fallbackAvatar = require("../../assets/logo.png");

export const Profile: React.FC = () => {
  const { palette } = useTheme();
  const navigation = useNavigation<any>();
  const { age, height, weight, goalWeight, activityLevel, allergies } = useProfile();
  const { profile, session, refreshProfile } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [nameModalVisible, setNameModalVisible] = React.useState(false);
  const [nameInput, setNameInput] = React.useState('');
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSavingName, setIsSavingName] = React.useState(false);
  const styles = React.useMemo(() => makeProfileStyles(palette), [palette]);

  const displayName = React.useMemo(() => {
    const trimmedFullName = profile?.full_name?.trim();
    if (trimmedFullName) return trimmedFullName;
    if (profile?.username) return profile.username;
    const usernameMeta =
      typeof session?.user?.user_metadata?.username === 'string'
        ? session.user.user_metadata.username
        : null;
    if (usernameMeta) return usernameMeta;
    const email = session?.user?.email;
    if (email && email.includes('@')) {
      return email.split('@')[0];
    }
    return 'Set up your profile';
  }, [profile?.full_name, profile?.username, session?.user?.email, session?.user?.user_metadata?.username]);

  const displayEmail = session?.user?.email ?? 'No email assigned';

  const avatarSource = React.useMemo<ImageSourcePropType>(() => {
    if (profile?.avatar_url) {
      return { uri: profile.avatar_url };
    }
    return fallbackAvatar;
  }, [profile?.avatar_url]);

  const openNameModal = React.useCallback(() => {
    if (!session?.user) {
      Alert.alert('Not logged in', 'Sign in to update your name.');
      return;
    }
    const initial = profile?.full_name?.trim() || profile?.username || displayName || '';
    setNameInput(initial);
    setNameError(null);
    setNameModalVisible(true);
  }, [displayName, profile?.full_name, profile?.username, session?.user]);

  const closeNameModal = React.useCallback(() => {
    if (!isSavingName) {
      setNameModalVisible(false);
    }
  }, [isSavingName]);


  const handleSaveName = React.useCallback(async () => {
    if (!session?.user?.id) {
      setNameError('You must be signed in.');
      return;
    }
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters.');
      return;
    }
    setIsSavingName(true);
    setNameError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: trimmed })
        .eq('id', session.user.id);
      if (error) throw error;
      await refreshProfile();
      setNameModalVisible(false);
    } catch (err: any) {
      setNameError(err?.message ?? 'Failed to update name.');
    } finally {
      setIsSavingName(false);
    }
  }, [nameInput, refreshProfile, session?.user?.id]);

  const handleAvatarPress = React.useCallback(async () => {
    if (!session?.user) {
      Alert.alert('Not logged in', 'Sign in to update your profile photo.');
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'We need access to your photos to change your avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.length) {
        return;
      }
      const asset = result.assets[0];
      if (!asset.uri) {
        throw new Error('Selected image is missing a file path.');
      }

      setIsUploadingAvatar(true);
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuffer);
      const extension = asset.fileName?.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `avatars/${session.user.id}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileBytes, {
          upsert: true,
          contentType: asset.mimeType ?? 'image/jpeg',
        });
      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      let publicUrl = publicData?.publicUrl ?? '';
      if (publicUrl) {
        try {
          const headResponse = await fetch(publicUrl, { method: 'HEAD' });
          if (!headResponse.ok) {
            publicUrl = '';
          }
        } catch {
          publicUrl = '';
        }
      }
      if (!publicUrl) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from('avatars')
          .createSignedUrl(filePath, 60 * 60 * 24 * 365);
        if (signedError) {
          throw signedError;
        }
        publicUrl = signedData?.signedUrl ?? '';
      }
      if (!publicUrl) {
        throw new Error('Unable to generate a URL for the uploaded avatar.');
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);
      if (updateError) {
        throw updateError;
      }
      await refreshProfile();
    } catch (error: any) {
      console.error('avatar update failed', error);
      Alert.alert('Avatar update failed', error?.message ?? 'Try again later.');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [refreshProfile, session?.user?.id]);


  const highlightItems = React.useMemo(
    () => [
      {
        key: 'age',
        label: 'Age',
        value: age ? `${age} years` : 'Not set',
        icon: 'calendar-outline',
        targetModal: 'age' as ModalType,
      },
      {
        key: 'height',
        label: 'Height',
        value: height ? `${height} cm` : 'Not set',
        icon: 'body-outline',
        targetModal: 'height' as ModalType,
      },
      {
        key: 'weight',
        label: 'Weight',
        value: weight ? `${weight} kg` : 'Not set',
        icon: 'barbell-outline',
        targetModal: 'weight' as ModalType,
      },
      {
        key: 'goalWeight',
        label: 'Target',
        value: goalWeight ? `${goalWeight} kg` : 'Not set',
        icon: 'flag-outline',
        targetModal: 'goal' as ModalType,
      },
      {
        key: 'activityLevel',
        label: 'Activity',
        value: activityLevel ?? 'Choose level',
        icon: 'pulse-outline',
        targetModal: 'activity' as ModalType,
      },
      {
        key: 'allergies',
        label: 'Allergies',
        value: allergies.length ? allergies.join(', ') : 'No allergies',
        icon: 'leaf-outline',
        targetModal: 'allergies' as ModalType,
      },
    ],
    [activityLevel, age, allergies, goalWeight, height, weight],
  );

  const handleInfoCardPress = React.useCallback(
    (target?: ModalType) => {
      if (!target) return;
      navigation.navigate('Settings', { focusModal: target });
    },
    [navigation],
  );

  const headerContent = (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsIcon} onPress={() => navigation.navigate('Settings')}>
          <Icon name="settings-outline" size={26} color={palette.text} />
        </TouchableOpacity>
        {/* Add a simple placeholder to avoid RN source errors */}
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={handleAvatarPress}
          activeOpacity={0.8}
          disabled={isUploadingAvatar}
        >
          <Image source={avatarSource} style={styles.avatar} />
          {isUploadingAvatar && (
            <View style={styles.avatarUploading}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={openNameModal} activeOpacity={0.8}>
          <Text style={styles.name}>{displayName}</Text>
        </TouchableOpacity>
        <Text style={styles.email}>{displayEmail}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Information</Text>
        <View style={styles.infoGrid}>
          {highlightItems.map(({ key, label, value, icon, targetModal }) => (
            <TouchableOpacity
              key={key}
              style={styles.infoCard}
              onPress={() => handleInfoCardPress(targetModal)}
              activeOpacity={0.85}
            >
              <View style={styles.infoIconWrapper}>
                <Icon name={icon} size={20} color={palette.primary} />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={[styles.infoValue, { color: palette.subText }]}>{value}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FriendsPanel />
      <ProfileAchivment />
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={headerContent}
        keyExtractor={(_, index) => `profile-static-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        style={{ backgroundColor: palette.background }}
      />

      <Modal
        transparent
        animationType="fade"
        visible={nameModalVisible}
        onRequestClose={closeNameModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.card100, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Change name</Text>
            <Text style={styles.modalSubtitle}>Update the name shown on your profile.</Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              style={[styles.modalInput, { borderColor: palette.border, color: palette.text }]}
              placeholderTextColor={palette.subText}
              autoCapitalize="words"
            />
            {nameError ? <Text style={{ color: '#ef4444', marginTop: 8 }}>{nameError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={closeNameModal}
                style={[styles.modalButton, { borderColor: palette.border, backgroundColor: palette.card }]}
                disabled={isSavingName}
              >
                <Text style={[styles.modalButtonText, { color: palette.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveName}
                style={[styles.modalButton, styles.modalPrimaryButton]}
                disabled={isSavingName}
              >
                {isSavingName ? (
                  <ActivityIndicator color={palette.onPrimary} />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default Profile;
