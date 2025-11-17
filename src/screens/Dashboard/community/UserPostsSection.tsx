// community/UserPostsSection.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { PostComponent } from './PostComponent';
import type { Post, PostStats } from './community.types';

type Props = {
  availableHeight: number;
};

export const UserPostsSection: React.FC<Props> = ({ availableHeight }) => {
  const { palette } = useTheme();
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      user: {
        id: 'user1',
        username: 'your_username',
        isVerified: true,
      },
      content: 'Just completed my morning workout! Feeling amazing after 45 minutes of intense cardio and strength training. 💪',
      image: 'https://picsum.photos/400/300?random=1',
      likes: 24,
      comments: [
        { id: 'c1', author: 'Anna', text: 'Great job!', userId: 'anna', timestamp: new Date().toISOString() },
        { id: 'c2', author: 'Mark', text: 'Keep it up!', userId: 'mark', timestamp: new Date().toISOString() }
      ],
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isLiked: true,
      type: 'workout',
      metrics: {
        calories: 420,
        duration: 45,
      },
    },
    {
      id: '2',
      user: {
        id: 'user1',
        username: 'your_username',
        isVerified: true,
      },
      content: 'Healthy breakfast to start the day right! Avocado toast with poached eggs and fresh vegetables. 🥑🍳',
      image: 'https://picsum.photos/400/300?random=2',
      likes: 18,
      comments: [
        { id: 'c3', author: 'Olivia', text: 'Looks delicious!', userId: 'olivia', timestamp: new Date().toISOString() }
      ],
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isLiked: false,
      type: 'meal',
      metrics: {
        calories: 350,
      },
    },
  ]);

  const stats: PostStats = {
    posts: 12,
    followers: 245,
    following: 156,
  };

  const handleLike = (postId: string) => {
    setPosts(currentPosts =>
      currentPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleComment = (postId: string) => {
    console.log('Open comments for post:', postId);
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
    editButton: {
      backgroundColor: palette.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 20,
      alignSelf: 'center' as const,
    },
    editButtonText: {
      color: palette.onPrimary,
      fontSize: 14,
      fontWeight: '600' as const,
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
  }), [palette]);

  return (
    <View style={[styles.container, { height: availableHeight }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostComponent
            post={item}
            onLike={handleLike}
            onComment={handleComment}
          />
        )}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={48} color={palette.subText} />
              </View>
              <Text style={styles.username}>your_username</Text>
              <Text style={styles.bio}>Fitness enthusiast • Healthy lifestyle • Progress over perfection</Text>
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

            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="camera-outline" size={64} color={palette.subText} />
            <Text style={styles.emptyStateText}>
              You haven't shared any posts yet.{'\n'}Start sharing your fitness journey!
            </Text>
            <TouchableOpacity style={[styles.editButton, { marginTop: 20 }]}>
              <Text style={styles.editButtonText}>Create First Post</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};