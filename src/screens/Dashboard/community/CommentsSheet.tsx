// CommentsSheet.tsx - modal for viewing and adding comments
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useComments } from '@hooks/useComments';
import { useAuth } from '@context/AuthContext';
import type { Comment as PostComment } from '@hooks/useComments';

type CommentsSheetProps = {
  visible: boolean;
  postId: string | null;
  onClose: () => void;
  onCommentAdded?: () => void;
};

export const CommentsSheet: React.FC<CommentsSheetProps> = ({
  visible,
  postId,
  onClose,
  onCommentAdded,
}) => {
  const { palette } = useTheme();
  const { session } = useAuth();
  const { comments, loading, submitting, refresh, addComment } = useComments(postId);
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) {
      refresh();
    } else {
      setText('');
    }
  }, [visible, refresh]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.35)',
          justifyContent: 'flex-end',
        },
        container: {
          backgroundColor: palette.card100,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '80%',
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        },
        title: { fontSize: 18, fontWeight: '700', color: palette.text },
        closeButton: { padding: 8 },
        listContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
        commentCard: {
          backgroundColor: palette.background,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: palette.border,
        },
        commentAuthor: { fontWeight: '700', color: palette.text, marginBottom: 4 },
        commentText: { color: palette.text, lineHeight: 18 },
        emptyState: { alignItems: 'center', padding: 20, gap: 8 },
        emptyText: { color: palette.subText, textAlign: 'center' },
        inputRow: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: palette.border,
        },
        input: {
          flex: 1,
          backgroundColor: palette.background,
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: palette.text,
        },
        sendButton: {
          backgroundColor: palette.primary,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: 52,
        },
        sendText: { color: palette.onPrimary, fontWeight: '700' },
        loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
      }),
    [palette]
  );

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await addComment(text);
      setText('');
      onCommentAdded?.();
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  };

  const renderItem = ({ item }: { item: PostComment }) => (
    <View style={styles.commentCard}>
      <Text style={styles.commentAuthor}>
        {item.user?.full_name || item.user?.username || 'User'}
      </Text>
      <Text style={styles.commentText}>{item.content}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={palette.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={palette.text} />
              <Text style={{ color: palette.subText }}>Loading comments...</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubble-ellipses-outline" size={32} color={palette.subText} />
                  <Text style={styles.emptyText}>No comments yet. Start the conversation!</Text>
                </View>
              }
              contentContainerStyle={styles.listContent}
            />
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={
                session ? 'Add a comment...' : 'Sign in to add a comment'
              }
              placeholderTextColor={palette.subText}
              value={text}
              onChangeText={setText}
              editable={!!session && !submitting}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, { opacity: submitting || !text.trim() ? 0.6 : 1 }]}
              onPress={handleSend}
              disabled={!session || submitting || !text.trim()}
            >
              {submitting ? (
                <ActivityIndicator color={palette.onPrimary} />
              ) : (
                <Text style={styles.sendText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
