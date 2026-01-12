import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { useConversationList } from '@hooks/useMessages';

const fallbackAvatar = require('../../assets/logo.png');

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString();
};

export const ChatList: React.FC = () => {
  const { palette } = useTheme();
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const { conversations, loading, refresh } = useConversationList();

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
        title: { fontSize: 18, fontWeight: '700', color: palette.text, marginLeft: 10 },
        item: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
          backgroundColor: palette.card,
        },
        avatar: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: palette.border,
        },
        itemText: { flex: 1, marginLeft: 12 },
        name: { fontSize: 15, fontWeight: '700', color: palette.text },
        preview: { fontSize: 13, color: palette.subText, marginTop: 4 },
        time: { fontSize: 12, color: palette.subText, marginLeft: 8 },
        rowTop: { flexDirection: 'row', alignItems: 'center' },
        empty: { padding: 24, alignItems: 'center' },
        emptyText: { marginTop: 8, color: palette.subText, textAlign: 'center' },
      }),
    [palette]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const renderItem = ({ item }: any) => {
    const displayName = item.profile.full_name || item.profile.username || 'User';
    return (
      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('ChatThread', {
            userId: item.userId,
            username: item.profile.username,
            full_name: item.profile.full_name,
          })
        }
      >
        <Image
          source={item.profile.avatar_url ? { uri: item.profile.avatar_url } : fallbackAvatar}
          style={styles.avatar}
        />
        <View style={styles.itemText}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.time}>{formatTimestamp(item.lastMessage.created_at)}</Text>
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            {item.lastMessage.sender_id === session?.user?.id ? 'You: ' : ''}
            {item.lastMessage.content}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.subText} />
      </TouchableOpacity>
    );
  };

  if (!session?.user?.id) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
            <Ionicons name="chevron-back" size={22} color={palette.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Chats</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>You must be logged in to see your chats.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
          <Ionicons name="chevron-back" size={22} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Chats</Text>
      </View>

      {loading && conversations.length === 0 ? (
        <View style={styles.empty}>
          <ActivityIndicator color={palette.primary} />
          <Text style={styles.emptyText}>Loading your chats...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.userId}
          renderItem={renderItem}
          onRefresh={refresh}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color={palette.subText} />
              <Text style={styles.emptyText}>
                No conversations yet. Open a profile and start a chat.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default ChatList;
