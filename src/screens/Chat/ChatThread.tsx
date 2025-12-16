import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { useDirectMessages, DirectMessage, MessageProfile } from '@hooks/useMessages';
import { supabase } from '@utils/supabase';

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

type RouteParams = {
  userId: string;
  username?: string | null;
  full_name?: string | null;
};

export const ChatThread: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { userId, username, full_name } = (route.params || {}) as RouteParams;
  const { palette } = useTheme();
  const { session } = useAuth();
  const { messages, loading, sending, refresh, sendMessage } = useDirectMessages(userId || null);
  const [input, setInput] = useState('');
  const [targetProfile, setTargetProfile] = useState<MessageProfile | null>(null);
  const listRef = useRef<FlatList<DirectMessage> | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: palette.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
          backgroundColor: palette.card100,
        },
        title: { fontSize: 16, fontWeight: '700', color: palette.text, marginLeft: 10 },
        list: { flex: 1 },
        listContent: { padding: 12, paddingBottom: 16 },
        bubbleRow: { marginBottom: 10, flexDirection: 'row' },
        bubble: {
          maxWidth: '78%',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 14,
        },
        bubbleMine: {
          marginLeft: 'auto',
          backgroundColor: palette.primary,
        },
        bubbleTheirs: {
          marginRight: 'auto',
          backgroundColor: palette.card100,
          borderWidth: 1,
          borderColor: palette.border,
        },
        bubbleText: { color: palette.onPrimary, fontSize: 14 },
        bubbleTextAlt: { color: palette.text, fontSize: 14 },
        metaRow: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 4,
        },
        metaText: { fontSize: 11, color: palette.onPrimary },
        metaTextAlt: { fontSize: 11, color: palette.subText },
        inputBar: {
          borderTopWidth: 1,
          borderTopColor: palette.border,
          backgroundColor: palette.card100,
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
        },
        input: {
          flex: 1,
          borderWidth: 1,
          borderColor: palette.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          color: palette.text,
          backgroundColor: palette.card,
          marginRight: 10,
        },
        sendButton: {
          width: 44,
          height: 44,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.primary,
        },
        emptyState: { padding: 24, alignItems: 'center' },
        emptyText: { color: palette.subText, marginTop: 6, textAlign: 'center' },
      }),
    [palette]
  );

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      const inferredName = full_name || username || '';
      if (inferredName) {
        setTargetProfile({
          id: userId,
          username: username ?? null,
          full_name: full_name ?? inferredName,
          avatar_url: null,
        });
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.warn('Failed to fetch chat partner profile', error);
        return;
      }
      if (data) {
        setTargetProfile(data as MessageProfile);
      }
    };
    loadProfile();
  }, [full_name, userId, username]);

  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);

  const handleSend = async () => {
    try {
      const sent = await sendMessage(input);
      if (sent) setInput('');
    } catch (err: any) {
      console.warn('Send failed', err?.message ?? err);
    }
  };

  const renderMessage = ({ item }: { item: DirectMessage }) => {
    const isMine = item.sender_id === session?.user?.id;
    const bubbleStyle = [styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs];
    const textStyle = isMine ? styles.bubbleText : styles.bubbleTextAlt;
    const metaStyle = isMine ? styles.metaText : styles.metaTextAlt;
    return (
      <View style={[styles.bubbleRow, { justifyContent: isMine ? 'flex-end' : 'flex-start' }]}>
        <View style={bubbleStyle}>
          <Text style={textStyle}>{item.content}</Text>
          <View style={styles.metaRow}>
            <Text style={metaStyle}>{formatTime(item.created_at)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const headerTitle =
    targetProfile?.full_name ||
    targetProfile?.username ||
    username ||
    full_name ||
    'Chat';

  if (!session?.user?.id) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
            <Ionicons name="chevron-back" size={22} color={palette.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Chat</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>You must be logged in to chat.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
          <Ionicons name="chevron-back" size={22} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{headerTitle}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={palette.primary} />
              <Text style={styles.emptyText}>Loading conversation...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color={palette.subText} />
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          )
        }
        onRefresh={refresh}
        refreshing={loading}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message"
          placeholderTextColor={palette.subText}
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={sending || !input.trim()}
        >
          {sending ? (
            <ActivityIndicator color={palette.onPrimary} />
          ) : (
            <Ionicons name="send" size={18} color={palette.onPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatThread;
