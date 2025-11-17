// UserPostsSection.tsx - user feed with profile header
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { PostComponent } from './PostComponent';
import { usePosts } from '../../../hooks/usePosts';
import { useAuth } from '../../../context/AuthContext';
import { CreatePostModal } from './CreatePostModal';
import type { PostStats } from './community.types';

type Props = {
  availableHeight: number;
};

export const UserPostsSection: React.FC<Props> = ({ availableHeight }) => {
  const { palette } = useTheme();
  const { posts, loading, refreshing, likePost, deletePost, refetch } = usePosts();
  const { profile, session } = useAuth();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const userPosts = useMemo(() => {
    const filtered = posts.filter(post => post.user_id === session?.user?.id);
    return filtered;
  }, [posts, session?.user?.id]);

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

  const convertToLegacyPost = (post: any) => ({
    id: post.id,
    user: {
      id: post.user?.id || post.user_id || session?.user?.id || 'unknown',
      username: post.user?.full_name || post.user?.username || profile?.full_name || profile?.username || 'You',
      avatar: post.user?.avatar_url || profile?.avatar_url,
      isVerified: false,
    },
    content: post.content,
    image: post.image_url,
    likes: post.likes_count || 0,
    comments: [],
    timestamp: post.created_at,
    isLiked: post.is_liked || false,
    type: post.post_type,
    metrics: {
      calories: post.calories || undefined,
      duration: post.duration || undefined,
      distance: post.distance || undefined,
      weight: post.weight || undefined,
    },
  });

  const stats: PostStats = {
    posts: userPosts.length,
    followers: 245,
    following: 156,
  };

  const handleComment = (postId: string) => {};

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

  const displayName = profile?.full_name || profile?.username || 'Your Profile';
  const displayHandle = profile?.username ? `@${profile.username}` : 'Set up your username';

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
        data={userPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostComponent
            post={convertToLegacyPost(item)}
            onLike={() => likePost(item.id)}
            onComment={handleComment}
            onDelete={() => deletePost(item.id)}
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        nestedScrollEnabled
        style={{ flex: 1 }}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <View style={styles.avatar}>{avatarNode}</View>
              <Text style={styles.username}>{displayName}</Text>
              <Text style={styles.bio}>
                {displayHandle} • Fitness enthusiast • Healthy lifestyle • Progress over perfection
              </Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
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
    </View>
  );
};
