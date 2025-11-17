// community/PostComponent.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { Post } from './community.types';

type PostComponentProps = {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
};

export const PostComponent: React.FC<PostComponentProps> = ({ post, onLike, onComment }) => {
  const { palette } = useTheme();

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'workout':
        return 'fitness';
      case 'meal':
        return 'restaurant';
      case 'progress':
        return 'trending-up';
      case 'achievement':
        return 'trophy';
      case 'blog':
        return 'book';
      default:
        return 'ellipse';
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: palette.card100,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 16,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: palette.border,
      marginRight: 12,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    userInfo: {
      flex: 1,
    },
    usernameRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    username: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: palette.text,
      marginRight: 6,
    },
    timestamp: {
      fontSize: 12,
      color: palette.subText,
    },
    typeBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: palette.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    typeText: {
      fontSize: 12,
      color: palette.primary,
      marginLeft: 4,
      fontWeight: '500' as const,
    },
    content: {
      fontSize: 14,
      color: palette.text,
      lineHeight: 20,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    image: {
      width: '100%',
      height: 300,
      backgroundColor: palette.border,
    },
    metricsContainer: {
      flexDirection: 'row' as const,
      padding: 16,
      backgroundColor: palette.background,
      gap: 16,
    },
    metricItem: {
      backgroundColor: palette.card,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      minWidth: 80,
    },
    metricLabel: {
      fontSize: 11,
      color: palette.subText,
      marginBottom: 2,
    },
    metricValue: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: palette.text,
    },
    actionsContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: palette.border,
    },
    actionButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
      justifyContent: 'center' as const,
    },
    actionText: {
      marginLeft: 6,
      fontSize: 14,
      fontWeight: '500' as const,
    },
  });

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={palette.subText} />
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>
              {post.user.username}
            </Text>
            {post.user.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color={palette.primary} />
            )}
          </View>
          <Text style={styles.timestamp}>
            {formatTimestamp(post.timestamp)}
          </Text>
        </View>

        <View style={styles.typeBadge}>
          <Ionicons 
            name={getPostTypeIcon(post.type)} 
            size={14} 
            color={palette.primary} 
          />
          <Text style={styles.typeText}>
            {post.type}
          </Text>
        </View>
      </View>

      {/* Post Content */}
      <Text style={styles.content}>
        {post.content}
      </Text>

      {/* Post Image */}
      {post.image && (
        <Image
          source={{ uri: post.image }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Metrics */}
      {post.metrics && Object.keys(post.metrics).length > 0 && (
        <View style={styles.metricsContainer}>
          {post.metrics.calories && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>CALORIES</Text>
              <Text style={styles.metricValue}>
                {post.metrics.calories}
              </Text>
            </View>
          )}
          {post.metrics.duration && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>DURATION</Text>
              <Text style={styles.metricValue}>
                {post.metrics.duration}min
              </Text>
            </View>
          )}
          {post.metrics.distance && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>DISTANCE</Text>
              <Text style={styles.metricValue}>
                {post.metrics.distance}km
              </Text>
            </View>
          )}
          {post.metrics.weight && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>WEIGHT</Text>
              <Text style={styles.metricValue}>
                {post.metrics.weight}kg
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Post Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onLike(post.id)}
        >
          <Ionicons 
            name={post.isLiked ? "heart" : "heart-outline"} 
            size={22} 
            color={post.isLiked ? '#FF375F' : palette.text} 
          />
          <Text style={[styles.actionText, { color: post.isLiked ? '#FF375F' : palette.text }]}>
            {post.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onComment(post.id)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={palette.text} />
          <Text style={[styles.actionText, { color: palette.text }]}>
            {post.comments.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={22} color={palette.text} />
          <Text style={[styles.actionText, { color: palette.text }]}>
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};