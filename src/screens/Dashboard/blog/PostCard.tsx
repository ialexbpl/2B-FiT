// PostCard: IG-like post tile with
// - header (title + avatar in right corner),
// - media area (fixed height, image or placeholder),
// - actions (like + comments toggle),
// - collapsible comments list.
import React, { useMemo, useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { makeBlogStyles } from './BlogStyles';

export type Comment = { id: string; author: string; text: string };
export type Post = {
  id: string;
  title: string;
  avatarUrl?: string;
  imageUrl?: string;
  likes: number;
  comments: Comment[];
};

type Props = { post: Post; height?: number };

export const PostCard: React.FC<Props> = ({ post, height }) => {
  const { palette, theme } = useTheme();
  const styles = useMemo(() => makeBlogStyles(palette, theme), [palette, theme]);
  // Local UI state per post
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const likeCount = liked ? post.likes + 1 : post.likes;
  const cardHeight = height ?? 420;
  // Leave more room for actions/comments so they're fully visible above the tab bar
  const mediaHeight = Math.max(200, cardHeight - 200);

  return (
    <View style={[styles.card, { height: cardHeight }] }>
      {/* Header: title + avatar (right) */}
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>{post.title}</Text>
        <View style={styles.avatarBox}>
          {post.avatarUrl ? (
            <Image source={{ uri: post.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: `${palette.primary}22` }]}> 
              <Ionicons name="person" size={16} color={palette.primary} />
            </View>
          )}
        </View>
      </View>

      {/* Media: fixed-height content area */}
      <View style={styles.media}>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={[styles.mediaImage, { height: mediaHeight }]} resizeMode="cover" />
        ) : (
          <View style={[styles.mediaImage, { height: mediaHeight, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="image" size={28} color={palette.subText} />
            <Text style={{ color: palette.subText, marginTop: 6 }}>Brak obrazu</Text>
          </View>
        )}
      </View>

      {/* Actions: like + comments */}
      <View style={styles.actionsRow}>
        <Pressable onPress={() => setLiked(v => !v)} style={styles.actionBtn} accessibilityLabel="Polub">
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? theme.colors.danger : palette.text} />
          <Text style={styles.actionText}>{likeCount}</Text>
        </Pressable>
        <Pressable onPress={() => setShowComments(v => !v)} style={styles.actionBtn} accessibilityLabel="Komentarze">
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={palette.text} />
          <Text style={styles.actionText}>{post.comments.length}</Text>
        </Pressable>
      </View>

      {/* Collapsible comments list */}
      {showComments && (
        <View style={styles.commentsBox}>
          {post.comments.length === 0 ? (
            <Text style={styles.commentEmpty}>Brak komentarzy</Text>
          ) : (
            post.comments.map(c => (
              <View key={c.id} style={styles.commentRow}>
                <Text style={styles.commentAuthor}>{c.author}</Text>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

export default PostCard;
