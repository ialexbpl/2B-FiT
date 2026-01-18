// community/PostComponent.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  findNodeHandle,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { useComments, type Comment as PostComment } from '@hooks/useComments';
import { Ionicons } from '@expo/vector-icons';
import type { Post } from './community.types';

type PostComponentProps = {
  post: Post;
  onLike: (postId: string) => void;
  onComment?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onUserPress?: (userId: string, username?: string | null) => void;
  onCommentAdded?: (postId: string) => void;
  forceCommentsOpen?: boolean;
  onCommentFocus?: (postId: string, options?: { delta?: number }) => void;
  commentsLayout?: 'compact' | 'expanded';
  allowCommentInput?: boolean;
  commentsOpen?: boolean;
  onCommentsToggle?: (postId: string, nextOpen: boolean) => void;
};

const InlineComments: React.FC<{
  postId: string;
  onCommentAdded?: (postId: string) => void;
  onCommentFocus?: (postId: string, options?: { delta?: number }) => void;
  inputRef: React.RefObject<TextInput>;
  inputFocusedRef: React.MutableRefObject<boolean>;
  updateInputBounds: () => void;
  layout: 'compact' | 'expanded';
  allowInput: boolean;
  autoFocus?: boolean;
}> = ({ postId, onCommentAdded, onCommentFocus, inputRef, inputFocusedRef, updateInputBounds, layout, allowInput, autoFocus }) => {
  const { palette } = useTheme();
  const { session } = useAuth();
  const { comments, loading, submitting, addComment } = useComments(postId);
  const [text, setText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const listRef = useRef<FlatList<PostComment>>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const keyboardHeightRef = useRef(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    inputRef.current?.blur();
  }, []);

  const requestScrollForInput = useCallback(() => {
    if (!allowInput) return;
    if (!inputFocusedRef.current) return;
    if (!onCommentFocus || !inputRef.current) return;
    const keyboardHeight = keyboardHeightRef.current;
    if (!keyboardHeight) return;
    inputRef.current.measureInWindow((_x, y, _width, height) => {
      const inputBottom = y + height;
      const visibleBottom = windowHeight - keyboardHeight - 12;
      if (inputBottom > visibleBottom) {
        onCommentFocus(postId, { delta: inputBottom - visibleBottom });
      }
    });
  }, [allowInput, inputRef, onCommentFocus, postId, windowHeight]);

  React.useEffect(() => {
    if (!allowInput) {
      return;
    }
    const handleKeyboardShow = (event: any) => {
      const nextHeight = event?.endCoordinates?.height ?? 0;
      keyboardHeightRef.current = nextHeight;
      if (!inputFocusedRef.current) {
        setKeyboardOffset(0);
        return;
      }
      setKeyboardOffset(nextHeight);
      updateInputBounds();
      requestAnimationFrame(requestScrollForInput);
    };
    const handleKeyboardHide = () => {
      keyboardHeightRef.current = 0;
      setKeyboardOffset(0);
      updateInputBounds();
    };
    const showSub = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);
    const raf = requestAnimationFrame(updateInputBounds);
    return () => {
      showSub.remove();
      hideSub.remove();
      cancelAnimationFrame(raf);
    };
  }, [allowInput, requestScrollForInput, updateInputBounds]);

  React.useEffect(() => {
    if (!autoFocus || !allowInput) return;
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);
    return () => clearTimeout(timeout);
  }, [allowInput, autoFocus, inputRef]);

  const handleSend = useCallback(async () => {
    if (!text.trim()) return;
    try {
      await addComment(text);
      setText('');
      onCommentAdded?.(postId);
    } catch (error) {
      console.error('Error sending comment:', error);
    } finally {
      dismissKeyboard();
    }
  }, [addComment, dismissKeyboard, onCommentAdded, postId, text]);

  const maxContainerHeight = Math.min(Math.round(windowHeight * 0.6), 520);
  const focusedContainerHeight = Math.min(Math.round(windowHeight * 0.5), 440);
  const containerHeight = inputFocused ? focusedContainerHeight : maxContainerHeight;
  const isCompact = layout === 'compact';
  const shouldFixHeight = !isCompact && allowInput;
  const commentRowMinHeight = 56;
  const commentGap = 8;
  const compactMaxVisible = 4;
  const compactListMaxHeight =
    commentRowMinHeight * compactMaxVisible + commentGap * (compactMaxVisible - 1);
  const noInputListMaxHeight = Math.min(Math.round(windowHeight * 0.4), 320);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderTopWidth: 1,
          borderTopColor: palette.border,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 12,
          backgroundColor: palette.card100,
        },
        listWrapper: {
          minHeight: 0,
        },
        listContent: {
          paddingBottom: 4,
        },
        commentCard: {
          backgroundColor: palette.background,
          borderRadius: 10,
          padding: 10,
          borderWidth: 1,
          borderColor: palette.border,
          marginBottom: 8,
        },
        commentAuthor: {
          fontWeight: '700',
          color: palette.text,
          marginBottom: 4,
          fontSize: 12,
        },
        commentText: { color: palette.text, lineHeight: 18, fontSize: 13 },
        emptyState: { alignItems: 'center', paddingVertical: 10 },
        emptyText: { color: palette.subText, textAlign: 'center', fontSize: 12 },
        loadingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 10,
        },
        inputRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 10,
        },
        input: {
          flex: 1,
          backgroundColor: palette.background,
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
          color: palette.text,
        },
        sendButton: {
          backgroundColor: palette.primary,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 10,
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: 48,
        },
        sendText: { color: palette.onPrimary, fontWeight: '700', fontSize: 12 },
      }),
    [palette]
  );

  const renderItem = ({ item }: { item: PostComment }) => (
    <View style={styles.commentCard}>
      <Text style={styles.commentAuthor}>
        {item.user?.full_name || item.user?.username || 'User'}
      </Text>
      <Text style={styles.commentText}>{item.content}</Text>
    </View>
  );

  const listContentStyle = useMemo(() => {
    if (isCompact || !allowInput) {
      return styles.listContent;
    }
    return [
      styles.listContent,
      { flexGrow: 1, justifyContent: comments.length ? 'flex-end' : 'center' },
    ];
  }, [allowInput, comments.length, isCompact, styles.listContent]);

  const listWrapperStyle = useMemo(
    () => [
      styles.listWrapper,
      isCompact
        ? { maxHeight: compactListMaxHeight }
        : shouldFixHeight
          ? { flex: 1, minHeight: 120 }
          : null,
    ],
    [compactListMaxHeight, isCompact, shouldFixHeight, styles.listWrapper]
  );

  const containerStyle = useMemo(
    () => [
      styles.container,
      shouldFixHeight && { height: containerHeight },
      !isCompact && allowInput && keyboardOffset ? { paddingBottom: keyboardOffset } : null,
    ],
    [allowInput, containerHeight, isCompact, keyboardOffset, shouldFixHeight, styles.container]
  );

  const handleListScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 12;
    const atBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = useCallback((animated = false) => {
    if (isCompact) {
      scrollRef.current?.scrollToEnd({ animated });
      return;
    }
    if (!allowInput) {
      return;
    }
    listRef.current?.scrollToEnd({ animated });
  }, [allowInput, isCompact]);

  React.useEffect(() => {
    if (!isAtBottom) return;
    const raf = requestAnimationFrame(() => scrollToBottom(false));
    return () => cancelAnimationFrame(raf);
  }, [comments.length, isAtBottom, scrollToBottom]);

  const content = (
    <View style={containerStyle}>
      <View
        style={listWrapperStyle}
        onStartShouldSetResponderCapture={() => {
          if (inputFocusedRef.current) {
            dismissKeyboard();
          }
          return false;
        }}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={palette.text} />
            <Text style={{ color: palette.subText }}>Loading comments...</Text>
          </View>
        ) : isCompact ? (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={listContentStyle}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            showsVerticalScrollIndicator={comments.length > compactMaxVisible}
            onScroll={handleListScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              if (isAtBottom) {
                scrollToBottom(false);
              }
            }}
          >
            {comments.length ? (
              comments.map((item) => (
                <View key={item.id} style={styles.commentCard}>
                  <Text style={styles.commentAuthor}>
                    {item.user?.full_name || item.user?.username || 'User'}
                  </Text>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No comments yet. Start the conversation!</Text>
              </View>
            )}
          </ScrollView>
        ) : allowInput ? (
          <FlatList
            ref={listRef}
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No comments yet. Start the conversation!</Text>
              </View>
            }
            contentContainerStyle={listContentStyle}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            showsVerticalScrollIndicator={!isCompact || comments.length > compactMaxVisible}
            style={isCompact ? undefined : { flex: 1 }}
            onScroll={handleListScroll}
            scrollEventThrottle={16}
            onContentSizeChange={(_width, _height) => {
              if (isAtBottom) {
                scrollToBottom(false);
              }
            }}
          />
        ) : (
          <ScrollView
            contentContainerStyle={listContentStyle}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            showsVerticalScrollIndicator={comments.length > compactMaxVisible}
            style={{ maxHeight: noInputListMaxHeight }}
          >
            {comments.length ? (
              comments.map((item) => (
                <View key={item.id} style={styles.commentCard}>
                  <Text style={styles.commentAuthor}>
                    {item.user?.full_name || item.user?.username || 'User'}
                  </Text>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No comments yet. Start the conversation!</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {allowInput ? (
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={session ? 'Add a comment...' : 'Sign in to add a comment'}
            placeholderTextColor={palette.subText}
            value={text}
            onChangeText={setText}
            editable={!!session && !submitting}
            multiline
            onFocus={() => {
              inputFocusedRef.current = true;
              setInputFocused(true);
              if (keyboardHeightRef.current) {
                setKeyboardOffset(keyboardHeightRef.current);
              }
              requestAnimationFrame(updateInputBounds);
              requestAnimationFrame(requestScrollForInput);
              setTimeout(requestScrollForInput, 120);
            }}
            onBlur={() => {
              inputFocusedRef.current = false;
              setInputFocused(false);
            }}
            onLayout={updateInputBounds}
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
      ) : null}
    </View>
  );

  if (isCompact || !allowInput) {
    return content;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      {content}
    </KeyboardAvoidingView>
  );
};

export const PostComponent: React.FC<PostComponentProps> = ({
  post,
  onLike,
  onComment,
  onDelete,
  onUserPress,
  onCommentAdded,
  forceCommentsOpen,
  onCommentFocus,
  commentsLayout = 'expanded',
  allowCommentInput = true,
  commentsOpen,
  onCommentsToggle,
}) => {
  const { palette } = useTheme();
  const commentCount = post.commentsCount ?? post.comments?.length ?? 0;
  const [internalCommentsOpen, setInternalCommentsOpen] = useState(false);
  const [autoFocusInput, setAutoFocusInput] = useState(false);
  const forceOpenRef = useRef(false);
  const commentInputRef = useRef<TextInput>(null);
  const commentInputFocusedRef = useRef(false);
  const commentInputBoundsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const isCommentsControlled = typeof commentsOpen === 'boolean';
  const resolvedCommentsOpen = isCommentsControlled ? commentsOpen : internalCommentsOpen;

  const updateCommentInputBounds = useCallback(() => {
    if (!commentInputRef.current) return;
    commentInputRef.current.measureInWindow((x, y, width, height) => {
      commentInputBoundsRef.current = { x, y, width, height };
    });
  }, []);

  const dismissInlineKeyboard = useCallback(() => {
    Keyboard.dismiss();
    commentInputRef.current?.blur();
  }, []);

  const handleRootTouchStart = useCallback((event: any) => {
    if (!resolvedCommentsOpen) {
      return;
    }
    const { pageX, pageY, target } = event.nativeEvent;
    const inputHandle = commentInputRef.current ? findNodeHandle(commentInputRef.current) : null;
    if (inputHandle != null && target === inputHandle) {
      return;
    }
    const bounds = commentInputBoundsRef.current;
    if (bounds) {
      const inside =
        pageX >= bounds.x &&
        pageX <= bounds.x + bounds.width &&
        pageY >= bounds.y &&
        pageY <= bounds.y + bounds.height;
      if (!inside) {
        dismissInlineKeyboard();
      }
      return;
    }
    dismissInlineKeyboard();
  }, [dismissInlineKeyboard, resolvedCommentsOpen]);

  const handleRootStartCapture = useCallback((event: any) => {
    handleRootTouchStart(event);
    return false;
  }, [handleRootTouchStart]);

  React.useEffect(() => {
    if (forceCommentsOpen && !forceOpenRef.current) {
      if (isCommentsControlled) {
        onCommentsToggle?.(post.id, true);
      } else {
        setInternalCommentsOpen(true);
      }
      setAutoFocusInput(false);
      forceOpenRef.current = true;
      return;
    }
    if (!forceCommentsOpen) {
      forceOpenRef.current = false;
    }
  }, [forceCommentsOpen, isCommentsControlled, onCommentsToggle, post.id]);

  React.useEffect(() => {
    if (resolvedCommentsOpen) {
      const raf = requestAnimationFrame(updateCommentInputBounds);
      return () => cancelAnimationFrame(raf);
    }
  }, [resolvedCommentsOpen, updateCommentInputBounds]);

  React.useEffect(() => {
    if (resolvedCommentsOpen && autoFocusInput) {
      const timeout = setTimeout(() => setAutoFocusInput(false), 0);
      return () => clearTimeout(timeout);
    }
  }, [autoFocusInput, resolvedCommentsOpen]);

  const handleCommentPress = useCallback(() => {
    const next = !resolvedCommentsOpen;
    if (!next || !allowCommentInput) {
      Keyboard.dismiss();
    }
    onComment?.(post.id);
    if (next) {
      setAutoFocusInput(Boolean(allowCommentInput));
      if (commentsLayout === 'expanded') {
        requestAnimationFrame(() => {
          onCommentFocus?.(post.id);
        });
      }
    }
    if (isCommentsControlled) {
      onCommentsToggle?.(post.id, next);
    } else {
      setInternalCommentsOpen(next);
    }
  }, [allowCommentInput, commentsLayout, isCommentsControlled, onComment, onCommentFocus, onCommentsToggle, post.id, resolvedCommentsOpen]);

  const handleShare = useCallback(async () => {
    const messageParts = [post.content?.trim(), post.image].filter(Boolean) as string[];
    const message = messageParts.join('\n\n') || 'Check out this post';
    try {
      await Share.share({ message });
    } catch (error) {
      console.warn('Share failed', error);
    }
  }, [post.content, post.image]);

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
      fontWeight: '600' as const,
      color: palette.text,
    },
    actionsContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 16,
    },
    actionButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    actionButtonActive: {
      opacity: 0.9,
    },
    actionText: {
      marginLeft: 6,
      fontSize: 14,
      fontWeight: '500' as const,
    },
  });

  return (
    <View
      style={styles.container}
      onTouchStart={handleRootTouchStart}
      onStartShouldSetResponderCapture={handleRootStartCapture}
    >
      {/* Post Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            onUserPress?.(post.user.id, post.user.username);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            {post.user.avatar ? (
              <Image source={{ uri: post.user.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
            ) : (
              <Ionicons name="person" size={20} color={palette.subText} />
            )}
          </View>
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <View style={styles.usernameRow}>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                onUserPress?.(post.user.id, post.user.username);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.username}>
                {post.user.username}
              </Text>
            </TouchableOpacity>
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
          onPress={() => {
            Keyboard.dismiss();
            onLike(post.id);
          }}
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
          style={[styles.actionButton, resolvedCommentsOpen && styles.actionButtonActive]}
          onPress={handleCommentPress}
        >
          <Ionicons name={resolvedCommentsOpen ? "chatbubble" : "chatbubble-outline"} size={20} color={palette.text} />
          <Text style={[styles.actionText, { color: palette.text }]}>
            {commentCount}
          </Text>
        </TouchableOpacity>

        {onDelete ? (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              Keyboard.dismiss();
              onDelete(post.id);
            }}
          >
            <Ionicons name="trash-outline" size={22} color={palette.text} />
            <Text style={[styles.actionText, { color: palette.text }]}>
              Delete
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Keyboard.dismiss();
              handleShare();
            }}
          >
            <Ionicons name="share-outline" size={22} color={palette.text} />
            <Text style={[styles.actionText, { color: palette.text }]}>
              Share
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {resolvedCommentsOpen && (
        <InlineComments
          postId={post.id}
          onCommentAdded={onCommentAdded}
          onCommentFocus={onCommentFocus}
          inputRef={commentInputRef}
          inputFocusedRef={commentInputFocusedRef}
          updateInputBounds={updateCommentInputBounds}
          layout={commentsLayout}
          allowInput={allowCommentInput}
          autoFocus={autoFocusInput}
        />
      )}
    </View>
  );
};
