// UserPostsSection.tsx - user feed with profile header
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Modal, TextInput, ActivityIndicator, Alert, Platform, Keyboard } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { PostComponent } from './PostComponent';
import { usePosts } from '../../../hooks/usePosts';
import { useAuth } from '../../../context/AuthContext';
import { CreatePostModal } from './CreatePostModal';
import type { PostStats } from './community.types';
import { useFriends } from '@hooks/useFriends';
import { supabase } from '@utils/supabase';

type Props = {
  availableHeight: number;
};

export const UserPostsSection: React.FC<Props> = ({ availableHeight }) => {
  const { palette } = useTheme();
  const { posts, loading, refreshing, likePost, deletePost, refetch, adjustCommentCount } = usePosts();
  const { profile, session } = useAuth();
  const { friendCount } = useFriends();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [bioModalVisible, setBioModalVisible] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [igInput, setIgInput] = useState('');
  const [fbInput, setFbInput] = useState('');
  const [bioError, setBioError] = useState<string | null>(null);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollOffsetRef = useRef(0);
  const commentScrollOffset = Platform.OS === 'ios' ? 200 : 160;

  const userPosts = useMemo(() => {
    const filtered = posts.filter(post => post.user_id === session?.user?.id);
    return filtered;
  }, [posts, session?.user?.id]);

  const totalLikes = useMemo(
    () => userPosts.reduce((acc, post) => acc + (post.likes_count || 0), 0),
    [userPosts]
  );

  useEffect(() => {
    if (openCommentsPostId && !userPosts.some(post => post.id === openCommentsPostId)) {
      setOpenCommentsPostId(null);
    }
  }, [openCommentsPostId, userPosts]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event?.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!createModalVisible) {
      refetch();
      setLastRefresh(new Date());
    }
  }, [createModalVisible]);

  const getTimeSinceLastRefresh = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  const convertToLegacyPost = (post: any, nameForUser: string) => {
    const isSelf = post.user_id === session?.user?.id;
    const avatar = post.user?.avatar_url || (isSelf ? profile?.avatar_url : undefined);
    return {
      id: post.id,
      user: {
        id: post.user?.id || post.user_id || session?.user?.id || 'unknown',
        username: post.user?.full_name || post.user?.username || nameForUser,
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
  };

  const stats: PostStats = {
    posts: userPosts.length,
    followers: friendCount, // repurposed as Friends
    following: totalLikes,  // repurposed as total likes
  };

  const postIndexMap = useMemo(
    () => new Map(userPosts.map((post, index) => [post.id, index])),
    [userPosts]
  );

  const scrollToPost = useCallback((postId: string, options?: { delta?: number }) => {
    if (options?.delta != null && options.delta > 0) {
      const nextOffset = Math.max(0, scrollOffsetRef.current + options.delta);
      scrollOffsetRef.current = nextOffset;
      flatListRef.current?.scrollToOffset({ offset: nextOffset, animated: true });
      return;
    }
    const index = postIndexMap.get(postId);
    if (index == null) return;
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 1,
      viewOffset: commentScrollOffset,
    });
  }, [commentScrollOffset, postIndexMap]);

  const handleScrollToIndexFailed = useCallback((info: { index: number; averageItemLength: number }) => {
    const offset = info.averageItemLength * info.index;
    flatListRef.current?.scrollToOffset({ offset, animated: true });
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 1,
        viewOffset: commentScrollOffset,
      });
    });
  }, [commentScrollOffset]);

  const handleRefresh = async () => {
    await refetch();
    setLastRefresh(new Date());
  };

  const avatarNode = profile?.avatar_url ? (
    <Image
      source={{ uri: profile.avatar_url }}
      style={{ width: 96, height: 96, borderRadius: 48 }}
    />
  ) : (
    <Ionicons name="person" size={48} color={palette.subText} />
  );

  const displayName = useMemo(() => {
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
    return 'Your Profile';
  }, [profile?.full_name, profile?.username, session?.user?.email, session?.user?.user_metadata?.username]);
  const meta = session?.user?.user_metadata as any;
  const bioText = meta?.bio || 'Add a short bio about yourself.';
  const hashtagsText = meta?.hashtags || '';
  const igText = meta?.instagram || '';
  const fbText = meta?.facebook || '';

  useEffect(() => {
    setBioInput(bioText);
    setHashtagsInput(hashtagsText);
    setIgInput(igText);
    setFbInput(fbText);
  }, [bioText, hashtagsText, igText, fbText]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.background },
    profileHeader: {
      backgroundColor: palette.card100,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    profileInfo: { alignItems: 'center', marginBottom: 20 },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: palette.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 3,
      borderColor: palette.primary,
      overflow: 'hidden',
    },
    username: { fontSize: 20, fontWeight: '700', color: palette.text, marginBottom: 6 },
    bio: { fontSize: 14, color: palette.subText, textAlign: 'center', lineHeight: 20 },
    links: { fontSize: 12, color: palette.primary, textAlign: 'center', marginTop: 6 },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: 18, fontWeight: '700', color: palette.text },
    statLabel: { fontSize: 12, color: palette.subText, marginTop: 4 },
    createButton: {
      backgroundColor: palette.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 24,
      alignSelf: 'center',
      marginBottom: 12,
    },
    createButtonText: { color: palette.onPrimary, fontWeight: '700' },
    refreshInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    refreshText: { color: palette.subText, fontSize: 12 },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: palette.card,
      borderRadius: 12,
    },
    refreshButtonText: { color: palette.primary, marginLeft: 6, fontWeight: '600' },
    emptyState: {
      alignItems: 'center',
      padding: 24,
      gap: 12,
    },
    emptyStateText: { fontSize: 16, color: palette.subText, textAlign: 'center', lineHeight: 22 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: availableHeight },
    loadingText: { marginTop: 12, fontSize: 16, color: palette.subText },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      padding: 16,
    },
    modalCard: {
      backgroundColor: palette.card100,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: palette.text, textAlign: 'center', marginBottom: 4 },
    modalSubtitle: { fontSize: 13, color: palette.subText, textAlign: 'center', marginBottom: 12 },
    modalInput: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: palette.text,
      backgroundColor: palette.card,
      marginBottom: 10,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
    modalGhost: { paddingVertical: 10, paddingHorizontal: 14 },
    modalGhostText: { color: palette.subText, fontWeight: '600' },
    modalPrimary: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: palette.primary,
    },
    modalPrimaryText: { color: palette.onPrimary, fontWeight: '700' },
  }), [palette, availableHeight]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={32} color={palette.subText} />
        <Text style={styles.loadingText}>Loading your posts...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: availableHeight }]}>
      <FlatList
        ref={flatListRef}
        data={userPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingBottom:
            openCommentsPostId && keyboardHeight ? keyboardHeight + 16 : 0,
        }}
        renderItem={({ item }) => (
          <PostComponent
            post={convertToLegacyPost(item, displayName)}
            onLike={() => likePost(item.id)}
            onCommentAdded={() => adjustCommentCount(item.id, 1)}
            onDelete={() => deletePost(item.id)}
            onCommentFocus={scrollToPost}
            commentsLayout="compact"
            commentsOpen={openCommentsPostId === item.id}
            onCommentsToggle={(_postId, nextOpen) => {
              setOpenCommentsPostId(nextOpen ? item.id : null);
            }}
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScroll={(event) => {
          scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        style={{ flex: 1 }}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <View style={styles.avatar}>{avatarNode}</View>
              <Text style={styles.username}>{displayName}</Text>
              <TouchableOpacity onPress={() => { setBioError(null); setBioModalVisible(true); }} activeOpacity={0.8}>
                <Text style={styles.bio}>
                  {bioText}
                </Text>
              </TouchableOpacity>
              {(hashtagsText || igText || fbText) ? (
                <Text style={styles.links}>
                  {[hashtagsText, igText, fbText].filter(Boolean).join('  •  ')}
                </Text>
              ) : null}
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.followers}</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.following}</Text>
                <Text style={styles.statLabel}>Total likes</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <Text style={styles.createButtonText}>Create Post</Text>
            </TouchableOpacity>

            <View style={styles.refreshInfo}>
              <Text style={styles.refreshText}>
                Last refresh: {getTimeSinceLastRefresh()}
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
              >
                <Ionicons name="refresh" size={14} color={palette.primary} />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="camera-outline" size={64} color={palette.subText} />
            <Text style={styles.emptyStateText}>
              You haven't shared any posts yet.{'\n'}Start sharing your fitness journey!
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { marginTop: 20 }]}
              onPress={() => setCreateModalVisible(true)}
            >
              <Text style={styles.createButtonText}>Create First Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh" size={14} color={palette.primary} />
              <Text style={styles.refreshButtonText}>Refresh Posts</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <CreatePostModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />

      <Modal
        transparent
        animationType="fade"
        visible={bioModalVisible}
        onRequestClose={() => setBioModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit bio & links</Text>
            <Text style={styles.modalSubtitle}>This saves to your account.</Text>
            <TextInput
              value={bioInput}
              onChangeText={setBioInput}
              placeholder="Bio"
              placeholderTextColor={palette.subText}
              style={[
                styles.modalInput,
                { minHeight: 80, textAlignVertical: 'top' },
              ]}
              multiline
            />
            <TextInput
              value={hashtagsInput}
              onChangeText={setHashtagsInput}
              placeholder="Hashtags (e.g. #fitness, #dieta)"
              placeholderTextColor={palette.subText}
              style={styles.modalInput}
            />
            <TextInput
              value={igInput}
              onChangeText={setIgInput}
              placeholder="Instagram (link or @username)"
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
            {bioError ? <Text style={{ color: '#ef4444', marginBottom: 8 }}>{bioError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setBioModalVisible(false)} disabled={isSavingBio}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!session?.user) {
                    Alert.alert('Not logged in', 'Sign in to edit bio.');
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
                }}
                disabled={isSavingBio}
                style={styles.modalPrimary}
              >
                {isSavingBio ? (
                  <ActivityIndicator color={palette.primary} />
                ) : (
                  <Text style={styles.modalPrimaryText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
