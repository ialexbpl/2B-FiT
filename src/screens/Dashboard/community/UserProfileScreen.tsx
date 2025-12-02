import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { usePosts } from '../../../hooks/usePosts';
import { PostComponent } from './PostComponent';
import { CommentsSheet } from './CommentsSheet';
import { fetchUserProfile, type UserProfileDetails } from '../../../api/userService';

type RouteParams = { userId: string; username?: string | null };

export const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userId, username } = route.params as RouteParams;
  const { palette } = useTheme();
  const { posts, refreshing, likePost, refetch, adjustCommentCount } = usePosts();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(username || 'User');
  const [profileData, setProfileData] = useState<UserProfileDetails | null>(null);

  const userPosts = useMemo(() => posts.filter(p => p.user_id === userId), [posts, userId]);
  const totalLikes = useMemo(
    () => userPosts.reduce((acc, post) => acc + (post.likes_count || 0), 0),
    [userPosts]
  );

  useEffect(() => {
    const match = userPosts[0]?.user;
    if (match?.username) setDisplayName(match.username);
  }, [userPosts]);

  useEffect(() => {
    if (username) setDisplayName(username);
  }, [username]);

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
    return () => {
      cancelled = true;
    };
  }, [userId]);

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

  const avatarNode = profileData?.avatar_url || userPosts[0]?.user?.avatar_url
    ? (
      <Image
        source={{ uri: profileData?.avatar_url || userPosts[0]?.user?.avatar_url }}
        style={{ width: 72, height: 72, borderRadius: 36 }}
      />
    ) : (
      <Ionicons name="person" size={48} color={palette.subText} />
    );

  const bioText = profileData?.bio || 'This user has not added a bio yet.';
  const linksText = [profileData?.hashtags, profileData?.instagram, profileData?.facebook]
    .filter(Boolean)
    .join('  |  ');

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6, marginRight: 8 }}>
          <Ionicons name="chevron-back" size={22} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{displayName}</Text>
      </View>

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

      <FlatList
        data={userPosts}
        keyExtractor={item => item.id}
        refreshing={refreshing}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <PostComponent
            post={{
              id: item.id,
              user: {
                id: item.user?.id || item.user_id || userId,
                username: item.user?.full_name || item.user?.username || displayName,
                avatar: item.user?.avatar_url,
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
            onComment={(pid) => setCommentPostId(pid)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={48} color={palette.subText} />
            <Text style={styles.emptyText}>No posts from this user yet.</Text>
          </View>
        }
      />

      <CommentsSheet
        visible={!!commentPostId}
        postId={commentPostId}
        onClose={() => setCommentPostId(null)}
        onCommentAdded={() => {
          if (commentPostId) adjustCommentCount(commentPostId, 1);
        }}
      />
    </View>
  );
};

export default UserProfileScreen;
