import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, Platform, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { usePosts } from '../../../hooks/usePosts';
import { useFriends } from '@hooks/useFriends';
import { PostComponent } from './PostComponent';
import { fetchUserProfile, type UserProfileDetails } from '../../../api/userService';
import { supabase } from '@utils/supabase';

type RouteParams = { userId: string; username?: string | null; from?: string };

export const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userId, username, from } = route.params as RouteParams;
  const { palette } = useTheme();
  const { session } = useAuth();
  const { posts, refreshing, likePost, refetch, adjustCommentCount } = usePosts();
  const {
    sendInvite,
    cancelInvite,
    acceptInvite,
    declineInvite,
    removeFriend,
    isUserMutating,
    isFriendshipMutating,
    relationForUser,
    relationshipsLoading,
  } = useFriends();
  const [displayName, setDisplayName] = useState(username || 'User');
  const [profileData, setProfileData] = useState<UserProfileDetails | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isSelf = session?.user?.id === userId;
  const flatListRef = useRef<FlatList>(null);
  const scrollOffsetRef = useRef(0);
  const commentScrollOffset = Platform.OS === 'ios' ? 200 : 160;

  const safeAction = useCallback(async (runner: () => Promise<void>) => {
    try {
      await runner();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert('Oops!', message);
    }
  }, []);

  const relation = !isSelf ? relationForUser(userId) : undefined;
  const relationType = relation?.type === 'declined' ? undefined : relation?.type;
  const relationId = relation?.friendshipId;
  const relationLoading = relationId ? isFriendshipMutating(relationId) : false;
  const relationActionDisabled = relationshipsLoading || relationLoading || isUserMutating(userId);

  const confirmRemoveFriend = useCallback(() => {
    if (!relation || relation.type !== 'friend') return;
    Alert.alert(
      `Remove ${displayName}?`,
      'They will be removed from your friends list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => safeAction(() => removeFriend(relation.friendshipId)),
        },
      ],
      { cancelable: true }
    );
  }, [displayName, relation, removeFriend, safeAction]);

  const userPosts = useMemo(() => posts.filter(p => p.user_id === userId), [posts, userId]);
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
    const match = userPosts[0]?.user;
    if (match?.username) setDisplayName(match.username);
  }, [userPosts]);

  useEffect(() => {
    if (username) setDisplayName(username);
  }, [username]);

  const openChat = useCallback(() => {
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'You need to be logged in to start a chat.');
      return;
    }
    if (isSelf) return;
    navigation.navigate('ChatThread', {
      userId,
      username: profileData?.username ?? username ?? displayName,
      full_name: profileData?.full_name ?? displayName,
    });
  }, [session?.user?.id, isSelf, navigation, userId, profileData?.username, profileData?.full_name, username, displayName]);

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      const profile = await fetchUserProfile(userId);
      if (!cancelled) {
        setProfileData(profile);
        if (profile?.full_name || profile?.username) {
          setDisplayName(profile.full_name || profile.username || 'User');
        }
      }
    };
    loadProfile();
    const loadPrivacy = async () => {
      const { data } = await supabase
        .from('profile_settings')
        .select('is_private')
        .eq('id', userId)
        .maybeSingle();
      const priv = Boolean((data as any)?.is_private);
      if (!cancelled) {
        setIsPrivate(priv);
        setBlocked(priv && session?.user?.id !== userId);
      }
    };
    loadPrivacy();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, userId]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.background },
    headerBar: {
      paddingTop: 14,
      paddingHorizontal: 16,
      paddingBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.card100,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerIconButton: {
      padding: 6,
    },
    title: { fontSize: 18, fontWeight: '700', color: palette.text },
    profileHeader: {
      backgroundColor: palette.card100,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    profileInfo: { alignItems: 'center', marginBottom: 12 },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: palette.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      overflow: 'hidden',
      borderWidth: 3,
      borderColor: palette.primary,
    },
    usernameText: { fontSize: 18, fontWeight: '700', color: palette.text, marginBottom: 4 },
    handleText: { fontSize: 12, color: palette.subText, marginBottom: 4 },
    bio: { fontSize: 13, color: palette.subText, textAlign: 'center', lineHeight: 18 },
    links: { fontSize: 11, color: palette.primary, textAlign: 'center', marginTop: 4 },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 12,
    },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: 16, fontWeight: '700', color: palette.text },
    statLabel: { fontSize: 11, color: palette.subText, marginTop: 2 },
    empty: { padding: 24, alignItems: 'center' },
    emptyText: { color: palette.subText, textAlign: 'center', marginTop: 8 },
  }), [palette]);

  const friendActionNode = useMemo(() => {
    if (isSelf || !userId) return null;
    if (!relationType) {
      if (relationActionDisabled) {
        return (
          <View style={styles.headerIconButton}>
            <ActivityIndicator size="small" color={palette.primary} />
          </View>
        );
      }
      return (
        <TouchableOpacity
          onPress={() => safeAction(() => sendInvite(userId))}
          style={styles.headerIconButton}
        >
          <Ionicons name="person-add-outline" size={22} color={palette.primary} />
        </TouchableOpacity>
      );
    }

    if (relationType === 'friend') {
      return (
        <TouchableOpacity
          onPress={confirmRemoveFriend}
          style={styles.headerIconButton}
          disabled={relationActionDisabled}
        >
          {relationActionDisabled ? (
            <ActivityIndicator size="small" color={palette.subText} />
          ) : (
            <Ionicons name="person-remove-outline" size={22} color="#e11d48" />
          )}
        </TouchableOpacity>
      );
    }

    if (relationType === 'outgoing' && relationId) {
      return (
        <TouchableOpacity
          onPress={() => safeAction(() => cancelInvite(relationId))}
          style={styles.headerIconButton}
          disabled={relationActionDisabled}
        >
          <Ionicons
            name="close-circle-outline"
            size={22}
            color={relationActionDisabled ? palette.subText : palette.text}
          />
        </TouchableOpacity>
      );
    }

    if (relationType === 'incoming' && relationId) {
      return (
        <>
          <TouchableOpacity
            onPress={() => safeAction(() => declineInvite(relationId))}
            style={styles.headerIconButton}
            disabled={relationActionDisabled}
          >
            <Ionicons
              name="close-circle-outline"
              size={22}
              color={relationActionDisabled ? palette.subText : palette.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => safeAction(() => acceptInvite(relationId))}
            style={styles.headerIconButton}
            disabled={relationActionDisabled}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color={relationActionDisabled ? palette.subText : palette.primary}
            />
          </TouchableOpacity>
        </>
      );
    }

    if (relationType === 'blocked') {
      return (
        <View style={styles.headerIconButton}>
          <Ionicons name="lock-closed-outline" size={20} color={palette.subText} />
        </View>
      );
    }

    return null;
  }, [
    confirmRemoveFriend,
    isSelf,
    palette.primary,
    palette.subText,
    palette.text,
    acceptInvite,
    cancelInvite,
    declineInvite,
    relationActionDisabled,
    relationId,
    relationType,
    safeAction,
    sendInvite,
    userId,
  ]);

  const avatarUrl = profileData?.avatar_url || userPosts[0]?.user?.avatar_url || null;
  const avatarNode = avatarUrl ? (
    <Image
      source={{ uri: avatarUrl }}
      style={{ width: 72, height: 72, borderRadius: 36 }}
    />
  ) : (
    <Ionicons name="person" size={48} color={palette.subText} />
  );

  const bioText = profileData?.bio || 'This user has not added a bio yet.';
  const linksText = [profileData?.hashtags, profileData?.instagram, profileData?.facebook]
    .filter(Boolean)
    .join('  |  ');

  const handleBack = () => {
    if (from) {
      navigation.navigate(from as never);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Profile' as never);
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

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={handleBack} style={{ padding: 6, marginRight: 8 }}>
          <Ionicons name="chevron-back" size={22} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { flex: 1 }]} numberOfLines={1}>{displayName}</Text>
        <View style={styles.headerActions}>
          {friendActionNode}
          {!isSelf ? (
            <TouchableOpacity onPress={openChat} style={styles.headerIconButton}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={palette.text} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {blocked ? (
        <View style={[styles.profileHeader, { alignItems: 'center' }]}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>{avatarNode}</View>
            <Text style={styles.usernameText}>{displayName}</Text>
          </View>
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Ionicons name="lock-closed-outline" size={28} color={palette.subText} />
            <Text style={[styles.handleText, { marginTop: 8 }]}>This profile is private.</Text>
          </View>
        </View>
      ) : (
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>{avatarNode}</View>
          <Text style={styles.usernameText}>{displayName}</Text>
          {profileData?.username ? (
            <Text style={styles.handleText}>@{profileData.username}</Text>
          ) : null}
          <Text style={styles.bio}>{bioText}</Text>
          {linksText ? <Text style={styles.links}>{linksText}</Text> : null}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalLikes}</Text>
            <Text style={styles.statLabel}>Total likes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userPosts.reduce((acc, p) => acc + (p.comments_count || 0), 0)}</Text>
            <Text style={styles.statLabel}>Comments</Text>
          </View>
        </View>
      </View>
      )}

      {!blocked && (
        <FlatList
          ref={flatListRef}
          data={userPosts}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            paddingBottom:
              openCommentsPostId && keyboardHeight ? keyboardHeight + 16 : 0,
          }}
          refreshing={refreshing}
          onRefresh={refetch}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScroll={(event) => {
            scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          renderItem={({ item }) => (
            <PostComponent
              post={{
                id: item.id,
                user: {
                  id: item.user?.id || item.user_id || userId,
                  username: item.user?.full_name || item.user?.username || displayName,
                  avatar: item.user?.avatar_url || undefined,
                  isVerified: false,
                },
                content: item.content,
                image: item.image_url,
                likes: item.likes_count || 0,
                comments: [],
                commentsCount: item.comments_count || 0,
                timestamp: item.created_at,
                isLiked: item.is_liked || false,
                type: item.post_type,
                metrics: {
                  calories: item.calories || undefined,
                  duration: item.duration || undefined,
                  distance: item.distance || undefined,
                  weight: item.weight || undefined,
                },
              }}
              onLike={() => likePost(item.id)}
              onCommentAdded={() => adjustCommentCount(item.id, 1)}
              onCommentFocus={scrollToPost}
              commentsLayout="compact"
              commentsOpen={openCommentsPostId === item.id}
              onCommentsToggle={(_postId, nextOpen) => {
                setOpenCommentsPostId(nextOpen ? item.id : null);
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="albums-outline" size={48} color={palette.subText} />
              <Text style={styles.emptyText}>No posts from this user yet.</Text>
            </View>
          }
        />
      )}

    </View>
  );
};

export default UserProfileScreen;
