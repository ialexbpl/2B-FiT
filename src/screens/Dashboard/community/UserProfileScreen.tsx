import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { usePosts } from '../../../hooks/usePosts';
import { PostComponent } from './PostComponent';
import { CommentsSheet } from './CommentsSheet';

type RouteParams = { userId: string; username?: string | null };

export const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userId, username } = route.params as RouteParams;
  const { palette } = useTheme();
  const { posts, refreshing, likePost, refetch, adjustCommentCount } = usePosts();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(username || 'User');

  const userPosts = useMemo(() => posts.filter(p => p.user_id === userId), [posts, userId]);

  useEffect(() => {
    const match = userPosts[0]?.user;
    if (match?.username) setDisplayName(match.username);
  }, [userPosts]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.background },
    header: {
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
    empty: { padding: 24, alignItems: 'center' },
    emptyText: { color: palette.subText, textAlign: 'center', marginTop: 8 },
  }), [palette]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6, marginRight: 8 }}>
          <Ionicons name="chevron-back" size={22} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{displayName}</Text>
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
