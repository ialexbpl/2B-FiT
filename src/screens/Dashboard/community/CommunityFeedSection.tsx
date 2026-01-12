// CommunityFeedSection.tsx - WITH PAGER VIEW SUPPORT
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Text, Alert, Platform } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { PostComponent } from './PostComponent';
import { usePosts } from '../../../hooks/usePosts';
import { CreatePostModal } from './CreatePostModal';
import { useAuth } from '@context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@utils/supabase';

type Props = {
  availableHeight: number;
  onEnablePagerView?: () => void;
};

export const CommunityFeedSection: React.FC<Props> = ({
  availableHeight,
  onEnablePagerView
}) => {
  const { palette } = useTheme();
  const { profile, session } = useAuth();
  const { posts, loading, refreshing, likePost, refetch, adjustCommentCount } = usePosts();
  const [filteredUserId, setFilteredUserId] = useState<string | null>(null);
  const [filteredUsername, setFilteredUsername] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const flatListRef = useRef<FlatList>(null);
  const scrollOffsetRef = useRef(0);
  const commentScrollOffset = Platform.OS === 'ios' ? 200 : 160;

  useEffect(() => {
    if (!createModalVisible) {
      refetch();
      setLastRefresh(new Date());
    }
  }, [createModalVisible]);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollOffsetRef.current = offsetY;
    if (offsetY <= 0 && onEnablePagerView) {
      onEnablePagerView();
    }
  }, [onEnablePagerView]);
  const navigation = useNavigation<any>();

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
    commentsCount: post.comments_count || 0,
    timestamp: post.created_at,
    isLiked: post.is_liked || false,
    type: post.post_type,
    is_private: post.is_private || false,
    metrics: {
      calories: post.calories || undefined,
      duration: post.duration || undefined,
      distance: post.distance || undefined,
      weight: post.weight || undefined,
    },
  });

  const handleRefresh = async () => {
    await refetch();
    setLastRefresh(new Date());
  };

  const visiblePosts = useMemo(() => {
    const currentUserId = session?.user?.id;
    let list = posts;
    list = list.filter(p => !p.is_private || p.user_id === currentUserId);
    if (!filteredUserId && currentUserId) {
      list = list.filter(p => p.user_id !== currentUserId);
    }
    if (filteredUserId) {
      list = list.filter(p => p.user_id === filteredUserId);
    }
    return list;
  }, [posts, filteredUserId, session?.user?.id]);

  const postIndexMap = useMemo(
    () => new Map(visiblePosts.map((post, index) => [post.id, index])),
    [visiblePosts]
  );

  const scrollToPost = useCallback((postId: string, options?: { delta?: number }) => {
    if (options?.delta != null && options.delta > 0) {
      const nextOffset = Math.max(0, scrollOffsetRef.current + options.delta);
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
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostComponent
            post={convertToLegacyPost(item)}
            onLike={() => likePost(item.id)}
            onCommentAdded={() => adjustCommentCount(item.id, 1)}
            onCommentFocus={scrollToPost}
            commentsLayout="compact"
            onUserPress={async (userId, username) => {
              if (userId !== session?.user?.id) {
                try {
                  const { data } = await supabase
                    .from('profile_settings')
                    .select('is_private')
                    .eq('id', userId)
                    .maybeSingle();
                  const isPrivate = (data as any)?.is_private;
                  if (isPrivate === true) {
                    Alert.alert('Private profile', 'This user profile is private.');
                    return;
                  }
                } catch (e) {
                  // allow navigation on error to avoid false positives, posts are already filtered server-side
                }
              }
              navigation.navigate('UserProfileFeed', { userId, username, from: 'Dashboard' });
            }}
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={styles.refreshHeader}>
            <Text style={styles.refreshText}>
              {filteredUserId
                ? `Viewing ${filteredUsername || 'user'}`
                : `Last refresh: ${getTimeSinceLastRefresh()}`}
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => {
                if (filteredUserId) {
                  setFilteredUserId(null);
                  setFilteredUsername(null);
                } else {
                  handleRefresh();
                }
              }}
            >
              <Ionicons name={filteredUserId ? "close" : "refresh"} size={14} color={palette.primary} />
              <Text style={styles.refreshButtonText}>{filteredUserId ? 'Clear' : 'Refresh'}</Text>
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
