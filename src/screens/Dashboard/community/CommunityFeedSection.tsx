// CommunityFeedSection.tsx - Z OBSŁUGĄ PAGER VIEW
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { PostComponent } from './PostComponent';
import { usePosts } from '../../../hooks/usePosts';
import { CreatePostModal } from './CreatePostModal';
import { useAuth } from '@context/AuthContext';

type Props = {
  availableHeight: number;
  onEnablePagerView?: () => void;
};

export const CommunityFeedSection: React.FC<Props> = ({ 
  availableHeight, 
  onEnablePagerView 
}) => {
  const { palette } = useTheme();
  const { profile } = useAuth();
  const { posts, loading, refreshing, likePost, refetch } = usePosts();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!createModalVisible) {
      refetch();
      setLastRefresh(new Date());
    }
  }, [createModalVisible]);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY <= 0 && onEnablePagerView) {
      onEnablePagerView();
    }
  }, [onEnablePagerView]);

  const convertToLegacyPost = (post: any) => ({
    id: post.id,
    user: {
      id: post.user?.id || post.user_id || 'unknown',
      username: post.user?.full_name || post.user?.username || 'Unknown User',
      avatar: post.user?.avatar_url,
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

  const handleComment = (postId: string) => {};

  const handleRefresh = async () => {
    await refetch();
    setLastRefresh(new Date());
  };

  const getTimeSinceLastRefresh = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    refreshHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: palette.card100,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    refreshText: {
      fontSize: 12,
      color: palette.subText,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    refreshButtonText: {
      fontSize: 12,
      color: palette.primary,
      fontWeight: '600',
      marginLeft: 4,
    },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: palette.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      zIndex: 1000,
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
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      height: availableHeight,
    },
    emptyText: {
      fontSize: 16,
      color: palette.subText,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 22,
    },
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={32} color={palette.subText} />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={posts}
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.refreshHeader}>
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
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={palette.subText} />
            <Text style={styles.emptyText}>
              No posts yet.{'\n'}Be the first to share your fitness journey!
            </Text>
            <TouchableOpacity 
              style={[styles.fab, { position: 'relative', marginTop: 20 }]}
              onPress={() => setCreateModalVisible(true)}
            >
              <Ionicons name="add" size={24} color={palette.onPrimary} />
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={true}
      />

      {posts.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={palette.onPrimary} />
        </TouchableOpacity>
      )}

      <CreatePostModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </View>
  );
};
