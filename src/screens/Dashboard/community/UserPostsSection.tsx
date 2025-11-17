// UserPostsSection.tsx - ZAKTUALIZOWANA WERSJA
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
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
  const { posts, loading, refreshing, likePost, refetch } = usePosts();
  const { profile, session } = useAuth();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Filtruj tylko posty bieżącego użytkownika
  const userPosts = useMemo(() => {
    console.log('🔍 Filtering user posts...');
    const filtered = posts.filter(post => post.user_id === session?.user?.id);
    console.log(`✅ Found ${filtered.length} user posts`);
    return filtered;
  }, [posts, session?.user?.id]);

  // Auto-refresh po zamknięciu modala
  useEffect(() => {
    if (!createModalVisible) {
      console.log('🔄 Auto-refreshing after modal close');
      refetch();
      setLastRefresh(new Date());
    }
  }, [createModalVisible]);

  // Formatowanie czasu od ostatniego odświeżenia
  const getTimeSinceLastRefresh = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    }
  };

  const convertToLegacyPost = (post: any) => ({
    id: post.id,
    user: {
      id: post.user?.id || post.user_id || 'unknown',
      username: post.user?.username || post.user?.full_name || 'You',
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

  const handleComment = (postId: string) => {
    console.log('Open comments for post:', postId);
  };

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh started');
    await refetch();
    setLastRefresh(new Date());
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    profileHeader: {
      backgroundColor: palette.card100,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    profileInfo: {
      alignItems: 'center' as const,
      marginBottom: 20,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: palette.border,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
      borderWidth: 3,
      borderColor: palette.primary,
    },
    username: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: palette.text,
      marginBottom: 6,
    },
    bio: {
      fontSize: 14,
      color: palette.subText,
      textAlign: 'center' as const,
      lineHeight: 20,
    },
    statsContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    statItem: {
      alignItems: 'center' as const,
    },
    statNumber: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: palette.text,
    },
    statLabel: {
      fontSize: 12,
      color: palette.subText,
      marginTop: 4,
    },
    createButton: {
      backgroundColor: palette.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 20,
      alignSelf: 'center' as const,
      marginBottom: 12,
    },
    createButtonText: {
      color: palette.onPrimary,
      fontSize: 14,
      fontWeight: '600' as const,
    },
    refreshInfo: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    refreshText: {
      fontSize: 12,
      color: palette.subText,
    },
    refreshButton: {
      backgroundColor: palette.primary + '20',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      flexDirection: 'row' as const,
      alignItems: 'center',
    },
    refreshButtonText: {
      color: palette.primary,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 40,
      backgroundColor: palette.card100,
      margin: 16,
      borderRadius: 16,
    },
    emptyStateText: {
      fontSize: 16,
      color: palette.subText,
      textAlign: 'center' as const,
      marginTop: 16,
      lineHeight: 22,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      height: availableHeight,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: palette.subText,
    },
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
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        nestedScrollEnabled={true}
        style={{ flex: 1 }}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={48} color={palette.subText} />
              </View>
              <Text style={styles.username}>{profile?.username || profile?.full_name || 'Your Profile'}</Text>
              <Text style={styles.bio}>
                {profile?.username ? `@${profile.username} • ` : ''}
                Fitness enthusiast • Healthy lifestyle • Progress over perfection
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

            {/* Info o odświeżaniu */}
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