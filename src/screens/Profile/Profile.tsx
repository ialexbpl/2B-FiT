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
  Linking,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from 'expo-image-picker';
import { makeProfileStyles } from "./ProfileStyles";
// theme palettes are provided via ThemeContext
import { useTheme } from "../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@context/AuthContext";
import { supabase } from "@utils/supabase";
import { usePosts } from "@hooks/usePosts";
import { CreatePostModal } from "@screens/Dashboard/community/CreatePostModal";
import { PostComponent } from "@screens/Dashboard/community/PostComponent";
import { CommentsSheet } from "@screens/Dashboard/community/CommentsSheet";
import type { Post as LegacyPost } from "@screens/Dashboard/community/community.types";
import { useFriends } from "@hooks/useFriends";
import { FriendsPanel } from "./FriendsPanel";
import { ProfileAchivment } from "./ProfileAchivment";

const fallbackAvatar = require("../../assets/logo.png");

export const Profile: React.FC = () => {
  const { palette } = useTheme();
  const neutralBackground = palette.card;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { profile, session, refreshProfile } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [nameModalVisible, setNameModalVisible] = React.useState(false);
  const [nameInput, setNameInput] = React.useState('');
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSavingName, setIsSavingName] = React.useState(false);
  const [bioModalVisible, setBioModalVisible] = React.useState(false);
  const [bioInput, setBioInput] = React.useState('');
  const [hashtagsInput, setHashtagsInput] = React.useState('');
  const [igInput, setIgInput] = React.useState('');
  const [fbInput, setFbInput] = React.useState('');
  const [bioError, setBioError] = React.useState<string | null>(null);
  const [isSavingBio, setIsSavingBio] = React.useState(false);
  const {
    posts,
    loading: postsLoading,
    likePost,
    deletePost,
    refetch: refetchPosts,
    adjustCommentCount,
  } = usePosts();
  const {
    friendCount,
    incomingRequests,
    acceptanceNotifications,
  } = useFriends();
  const [createModalVisible, setCreateModalVisible] = React.useState(false);
  const [detailPost, setDetailPost] = React.useState<LegacyPost | null>(null);
  const [commentPostId, setCommentPostId] = React.useState<string | null>(null);
  const [friendsVisible, setFriendsVisible] = React.useState(false);
  const [notificationsVisible, setNotificationsVisible] = React.useState(false);
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

  const meta = session?.user?.user_metadata as any;
  const bioText = meta?.bio?.trim() || 'Dodaj krótki opis o sobie.';
  const hashtagsText = meta?.hashtags?.trim() || '';
  const igText = meta?.instagram?.trim() || '';
  const fbText = meta?.facebook?.trim() || '';

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

  React.useEffect(() => {
    setBioInput(bioText);
    setHashtagsInput(hashtagsText);
    setIgInput(igText);
    setFbInput(fbText);
  }, [bioText, hashtagsText, igText, fbText]);

  const saveBio = React.useCallback(async () => {
    if (!session?.user) {
      Alert.alert('Not logged in', 'Sign in to edit your bio.');
      return;
    }
    setIsSavingBio(true);
    setBioError(null);
    try {
      await supabase.auth.updateUser({
        data: {
          bio: bioInput.trim(),
          hashtags: hashtagsInput.trim(),
          instagram: igInput.trim(),
          facebook: fbInput.trim(),
        },
      });
      await supabase.auth.getSession();
      setBioModalVisible(false);
    } catch (e: any) {
      setBioError(e?.message ?? 'Failed to save bio.');
    } finally {
      setIsSavingBio(false);
    }
  }, [bioInput, hashtagsInput, igInput, fbInput, session?.user]);

  const userPosts = React.useMemo(
    () => posts.filter(post => post.user_id === session?.user?.id),
    [posts, session?.user?.id]
  );

  const totalLikes = React.useMemo(
    () => userPosts.reduce((acc, post) => acc + (post.likes_count || 0), 0),
    [userPosts]
  );
  const totalComments = React.useMemo(
    () => userPosts.reduce((acc, post) => acc + (post.comments_count || 0), 0),
    [userPosts]
  );
  const notificationsCount = (incomingRequests?.length || 0) + (acceptanceNotifications?.length || 0);

  const convertToLegacyPost = React.useCallback(
    (post: any): LegacyPost => {
      const isSelf = post.user_id === session?.user?.id;
      const avatar = post.user?.avatar_url || (isSelf ? profile?.avatar_url : undefined);
      return {
        id: post.id,
        user: {
          id: post.user?.id || post.user_id || session?.user?.id || 'unknown',
          username: post.user?.full_name || post.user?.username || displayName,
          avatar,
          isVerified: false,
        },
        content: post.content,
        image: post.image_url,
        likes: post.likes_count || 0,
        comments: [],
        commentsCount: post.comments_count || 0,
        timestamp: post.created_at,
        isLiked: post.is_liked || false,
        type: post.post_type,
        metrics: {
          calories: post.calories || undefined,
          duration: post.duration || undefined,
          distance: post.distance || undefined,
          weight: post.weight || undefined,
        },
      };
    },
    [displayName, profile?.avatar_url, session?.user?.id]
  );


  const handleOpenLink = React.useCallback((value: string) => {
    const safe = value.startsWith('http') ? value : `https://${value.replace(/^@/, '')}`;
    Linking.openURL(safe).catch(() => {
      Alert.alert('Link', safe);
    });
  }, []);

  const headerContent = (
    <View style={styles.sectionCombined}>
      <View style={styles.headerRow}>
        <View style={styles.topRightIcons}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => setNotificationsVisible(true)}
            activeOpacity={0.85}
          >
            <Icon name="notifications-outline" size={22} color={palette.text} />
            {notificationsCount > 0 && (
              <View style={styles.badgeDot} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsIcon} onPress={() => navigation.navigate('Settings')}>
            <Icon name="settings-outline" size={22} color={palette.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handleAvatarPress}
            activeOpacity={0.8}
            disabled={isUploadingAvatar}
          >
            <Image source={avatarSource} style={styles.avatarLarge} />
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
      </View>

      <View style={styles.statRow}>
        <TouchableOpacity style={styles.statItem} onPress={() => setFriendsVisible(true)} activeOpacity={0.85}>
          <Text style={styles.statNumber}>{friendCount}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </TouchableOpacity>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalLikes}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
        <TouchableOpacity style={styles.statItem} onPress={() => setCommentPostId(userPosts[0]?.id || null)} activeOpacity={0.85}>
          <Text style={styles.statNumber}>{totalComments}</Text>
          <Text style={styles.statLabel}>Comments</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bioBlockFlat}>
        <View style={styles.bioHeader}>
          <Text style={styles.bioTitle}>Bio</Text>
        </View>
        <TouchableOpacity onPress={() => { setBioModalVisible(true); setBioError(null); }} activeOpacity={0.85}>
          <Text style={styles.bioText}>{bioText}</Text>
        </TouchableOpacity>
        {hashtagsText ? (
          <View style={styles.hashtagsRow}>
            {hashtagsText.split(/\\s+/).filter(Boolean).map(tag => (
              <Text key={tag} style={styles.hashtagChip}>{tag.startsWith('#') ? tag : `#${tag}`}</Text>
            ))}
          </View>
        ) : null}
        {(igText || fbText) ? (
          <View style={styles.linksRow}>
            {igText ? (
              <TouchableOpacity
                style={styles.linkPill}
                onPress={() => handleOpenLink(igText)}
                activeOpacity={0.8}
              >
                <Icon name="logo-instagram" size={16} color={palette.primary} />
                <Text style={styles.linkText}>{igText}</Text>
              </TouchableOpacity>
            ) : null}
            {fbText ? (
              <TouchableOpacity
                style={styles.linkPill}
                onPress={() => handleOpenLink(fbText)}
                activeOpacity={0.8}
              >
                <Icon name="logo-facebook" size={16} color={palette.primary} />
                <Text style={styles.linkText}>{fbText}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 14, marginBottom: 10 }]}>My posts</Text>

      {postsLoading ? (
        <View style={styles.postsEmpty}>
          <ActivityIndicator color={palette.primary} />
          <Text style={styles.emptyText}>Loading your posts...</Text>
        </View>
      ) : userPosts.length === 0 ? (
        <View style={styles.postsEmpty}>
          <Icon name="camera-outline" size={36} color={palette.subText} />
          <Text style={[styles.emptyText, { marginTop: 6 }]}>No posts yet. Share your fitness journey!</Text>
          <TouchableOpacity
            style={[styles.postsActionButton, { paddingHorizontal: 16, paddingVertical: 10, marginTop: 8 }]}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.85}
          >
            <Icon name="add" size={18} color={palette.primary} />
            <Text style={[styles.postsActionText, { color: palette.primary }]}>Create post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.postsGrid}>
          {userPosts.map((post, idx) => (
            <View
              key={post.id}
              style={[
                styles.postTile,
                (idx % 2 === 0) && { marginRight: '4%' },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setDetailPost(convertToLegacyPost(post))}
              >
                {post.image_url ? (
                  <Image source={{ uri: post.image_url }} style={styles.postTileImage} />
                ) : (
                  <View style={styles.postTileFallback}>
                    <Text style={styles.postTileFallbackText} numberOfLines={3}>
                      {post.content}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.commentBar}
                activeOpacity={0.85}
                onPress={() => setCommentPostId(post.id)}
              >
                <Icon name="chatbubble-ellipses-outline" size={14} color={palette.subText} />
                <Text style={styles.commentBarText}>{post.comments_count || 0} comments</Text>
                <Text style={styles.commentBarAction}>Add</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={headerContent}
        ListFooterComponent={() => (
          <View style={styles.achievementsWrapper}>
            <ProfileAchivment />
          </View>
        )}
        keyExtractor={(_, index) => `profile-static-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        style={{ backgroundColor: palette.background }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreateModalVisible(true)}
        activeOpacity={0.85}
      >
        <Icon name="add" size={28} color={palette.onPrimary} />
      </TouchableOpacity>

      <CreatePostModal
        visible={createModalVisible}
        onClose={() => {
          setCreateModalVisible(false);
          refetchPosts();
        }}
      />

      <Modal
        visible={!!detailPost}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailPost(null)}
      >
        <View style={styles.postModalOverlay}>
          <View style={[styles.postModalCard, { backgroundColor: palette.card100, borderColor: palette.border }]}>
            <View style={styles.postModalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Post details</Text>
              <TouchableOpacity onPress={() => setDetailPost(null)}>
                <Icon name="close" size={22} color={palette.text} />
              </TouchableOpacity>
            </View>
            {detailPost ? (
              <PostComponent
                post={detailPost}
                onLike={() => {
                  likePost(detailPost.id);
                  setDetailPost(current =>
                    current ? { ...current, isLiked: !current.isLiked, likes: current.isLiked ? current.likes - 1 : current.likes + 1 } : current
                  );
                }}
                onComment={(postId) => {
                  setDetailPost(null); // close detail so comments sheet can slide in reliably
                  setTimeout(() => setCommentPostId(postId), 10);
                }}
                onDelete={async (postId) => {
                  try {
                    await deletePost(postId);
                    setDetailPost(null);
                    refetchPosts();
                  } catch (err: any) {
                    Alert.alert('Delete failed', err?.message ?? 'Could not delete post right now.');
                  }
                }}
              />
            ) : null}
          </View>
        </View>
      </Modal>

      <CommentsSheet
        visible={!!commentPostId}
        postId={commentPostId}
        onClose={() => setCommentPostId(null)}
        onCommentAdded={() => {
          if (commentPostId) {
            adjustCommentCount(commentPostId, 1);
          }
        }}
      />

      <Modal
        transparent
        animationType="fade"
        visible={notificationsVisible}
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={[styles.modalOverlay, { paddingTop: insets.top + 20 }]}>
           <View style={[styles.modalCard, { backgroundColor: palette.background, borderColor: palette.border, maxHeight: '70%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <Icon name="close" size={20} color={palette.text} />
              </TouchableOpacity>
            </View>
            {notificationsCount === 0 ? (
              <Text style={[styles.emptyText, { textAlign: 'center', paddingVertical: 12 }]}>
                No friend invites right now.
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                {incomingRequests.map(req => (
                  <View key={`req-${req.id}`} style={styles.notificationItem}>
                    <Icon name="person-add-outline" size={18} color={palette.primary} />
                    <Text style={{ marginLeft: 8, color: palette.text }}>
                      {req.other.full_name || req.other.username || 'User'} sent you an invite
                    </Text>
                  </View>
                ))}
                {acceptanceNotifications?.map(note => (
                  <View key={`acc-${note.id}`} style={styles.notificationItem}>
                    <Icon name="checkmark-circle-outline" size={18} color={palette.primary} />
                    <Text style={{ marginLeft: 8, color: palette.text }}>
                      {note.other.full_name || note.other.username || 'User'} accepted your invite
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" visible={friendsVisible} onRequestClose={() => setFriendsVisible(false)}>
        <View style={{ flex: 1, backgroundColor: palette.background, padding: 16, paddingTop: insets.top + 16 }}>
          <View style={styles.modalHeaderRow}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Friends</Text>
            <TouchableOpacity onPress={() => setFriendsVisible(false)}>
              <Icon name="close" size={22} color={palette.text} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, marginTop: 8 }}>
            <FriendsPanel />
          </View>
        </View>
      </Modal>

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

      <Modal
        transparent
        animationType="fade"
        visible={bioModalVisible}
        onRequestClose={() => setBioModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.card100, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Edytuj bio</Text>
            <Text style={styles.modalSubtitle}>Dodaj opis, hashtagi i linki.</Text>
            <TextInput
              value={bioInput}
              onChangeText={setBioInput}
              placeholder="Bio"
              placeholderTextColor={palette.subText}
              style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
              multiline
            />
            <TextInput
              value={hashtagsInput}
              onChangeText={setHashtagsInput}
              placeholder="Hashtagi (np. #fitness #dieta)"
              placeholderTextColor={palette.subText}
              style={styles.modalInput}
            />
            <TextInput
              value={igInput}
              onChangeText={setIgInput}
              placeholder="Instagram (link lub @username)"
              placeholderTextColor={palette.subText}
              style={styles.modalInput}
              autoCapitalize="none"
            />
            <TextInput
              value={fbInput}
              onChangeText={setFbInput}
              placeholder="Facebook (link)"
              placeholderTextColor={palette.subText}
              style={styles.modalInput}
              autoCapitalize="none"
            />
            {bioError ? <Text style={{ color: '#ef4444', marginTop: 8 }}>{bioError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setBioModalVisible(false)}
                style={[styles.modalButton, { borderColor: palette.border, backgroundColor: palette.card }]}
                disabled={isSavingBio}
              >
                <Text style={[styles.modalButtonText, { color: palette.text }]}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveBio}
                style={[styles.modalButton, styles.modalPrimaryButton]}
                disabled={isSavingBio}
              >
                {isSavingBio ? (
                  <ActivityIndicator color={palette.onPrimary} />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>Zapisz</Text>
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
