import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '@context/ThemeContext';
import { makeProfileStyles } from './ProfileStyles';
import { useFriends, FriendListEntry } from '@hooks/useFriends';

const fallbackAvatar = require('../../assets/logo.png');
const PREVIEW_LIMIT = 5;

const formatDate = (value: string | null) => {
  if (!value) return 'just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'just now';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const resolveName = (profile: { full_name: string | null; username: string | null }) =>
  (profile.full_name && profile.full_name.trim().length ? profile.full_name.trim() : null) ||
  profile.username ||
  'User';

const resolveUsername = (profile: { username: string | null }) =>
  profile.username ? `@${profile.username}` : '';

export const FriendsPanel: React.FC = () => {
  const { palette } = useTheme();
  const styles = useMemo(() => makeProfileStyles(palette), [palette]);
  const navigation = useNavigation<any>();

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    relationshipsLoading,
    incomingRequests,
    acceptanceNotifications,
    friendCount,
    friends,
    sendInvite,
    cancelInvite,
    acceptInvite,
    declineInvite,
    acknowledgeNotification,
    removeFriend,
    isUserMutating,
    isFriendshipMutating,
    refresh,
  } = useFriends();

  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [finderModalVisible, setFinderModalVisible] = useState(false);
  const [friendsFilter, setFriendsFilter] = useState('');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const safeAction = useCallback(async (runner: () => Promise<void>) => {
    try {
      await runner();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert('Oops!', message);
    }
  }, []);

  // --- FUNKCJA NAWIGACJI DO CZATU ---
  const handleOpenChat = useCallback((friendId: string) => {
    // Zamknij modal, aby po powrocie z czatu nie zasłaniał ekranu
    setFriendsModalVisible(false);
    
    // Nawigacja do innego Taba (Profile) i zagnieżdżonego ekranu (UserChatScreen)
    navigation.navigate('Profile', { 
      screen: 'UserChatScreen',
      params: { 
        friendId: friendId,
      },
    });
  }, [navigation]);

  const friendsPreview = useMemo(() => friends.slice(0, PREVIEW_LIMIT), [friends]);

  const filteredFriends = useMemo(() => {
    const term = friendsFilter.trim().toLowerCase();
    if (!term) return friends;
    return friends.filter(entry => {
      const name = resolveName(entry.profile).toLowerCase();
      const username = resolveUsername(entry.profile).toLowerCase();
      return name.includes(term) || username.includes(term);
    });
  }, [friends, friendsFilter]);

  const availableCandidates = useMemo(
    () => searchResults.filter(item => item.relation?.type !== 'friend'),
    [searchResults]
  );

  const closeFriendsModal = () => {
    setFriendsModalVisible(false);
    setFriendsFilter('');
  };

  const closeFinderModal = () => {
    setFinderModalVisible(false);
    setSearchQuery('');
  };

  const openFinderModal = () => {
    setFinderModalVisible(true);
    refresh();
  };

  const handleRespondFromSearch = useCallback(
    (friendshipId: string, displayName: string) => {
      Alert.alert(`Response for ${displayName}`, 'Do you accept or decline the invitation?', [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => safeAction(() => declineInvite(friendshipId)),
        },
        { text: 'Accept', onPress: () => safeAction(() => acceptInvite(friendshipId)) },
      ]);
    },
    [acceptInvite, declineInvite, safeAction]
  );

  const confirmRemoveFriend = useCallback(
    (friendshipId: string, displayName: string) => {
      Alert.alert(
        `Remove ${displayName}?`,
        'They will be removed from your friends list.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => safeAction(() => removeFriend(friendshipId)),
          },
        ],
        { cancelable: true }
      );
    },
    [removeFriend, safeAction]
  );

  // --- ZMIENIONA FUNKCJA RENDERUJĄCA ---
  const renderFriendRow = ({ item }: { item: FriendListEntry }) => (
    <TouchableOpacity
      style={styles.friendRow}
      activeOpacity={0.7}
      onPress={() => handleOpenChat(item.profile.id)} // Kliknięcie w cały wiersz otwiera czat
    >
      <Image
        source={item.profile.avatar_url ? { uri: item.profile.avatar_url } : fallbackAvatar}
        style={styles.friendAvatar}
      />
      <View style={styles.friendRowInfo}>
        <Text style={styles.friendRowName}>{resolveName(item.profile)}</Text>
        <Text style={styles.friendRowMeta}>
          {resolveUsername(item.profile)} {item.since ? `• od ${formatDate(item.since)}` : ''}
        </Text>
      </View>
      
      {/* KONTENER PRZYCISKÓW (CZAT + USUŃ OBOK SIEBIE) */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        
        {/* 1. Przycisk Czatu */}
        <TouchableOpacity
            // Dodajemy marginRight, aby oddzielić od przycisku usuwania
            style={[styles.friendGhostButton, { marginRight: 8 }]} 
            onPress={() => handleOpenChat(item.profile.id)}
        >
            <Icon name="chatbubble-ellipses-outline" size={22} color={palette.primary} />
        </TouchableOpacity>

        {/* 2. Przycisk Usuwania */}
        <TouchableOpacity
            style={styles.friendGhostButton}
            onPress={() => confirmRemoveFriend(item.friendshipId, resolveName(item.profile))}
            disabled={isFriendshipMutating(item.friendshipId)}
        >
            {isFriendshipMutating(item.friendshipId) ? (
            <ActivityIndicator size="small" color={palette.subText} />
            ) : (
            <Icon name="trash-outline" size={20} color="#e11d48" /> 
            // Użyłem ikony zamiast tekstu 'Remove', żeby pasowało do ikony czatu. 
            // Jeśli wolisz tekst, odkomentuj poniższą linię i usuń ikonę:
            // <Text style={[styles.friendGhostButtonText, { color: '#e11d48' }]}>Remove</Text>
            )}
        </TouchableOpacity>
      </View>

    </TouchableOpacity>
  );

  const renderFinderRow = ({ profile, relation }: typeof availableCandidates[number]) => {
    const displayName = resolveName(profile);
    let action: React.ReactNode = null;

    if (!relation || relation.type === 'declined') {
      const disabled = isUserMutating(profile.id);
      action = (
        <TouchableOpacity
          onPress={() => safeAction(() => sendInvite(profile.id))}
          style={styles.friendPrimaryButton}
          disabled={disabled}
        >
          {disabled ? (
            <ActivityIndicator size="small" color={palette.onPrimary} />
          ) : (
            <Text style={styles.friendPrimaryButtonText}>Dodaj</Text>
          )}
        </TouchableOpacity>
      );
    } else if (relation.type === 'outgoing') {
      const disabled = isFriendshipMutating(relation.friendshipId);
      action = (
        <TouchableOpacity
          onPress={() => safeAction(() => cancelInvite(relation.friendshipId))}
          style={styles.friendGhostButton}
          disabled={disabled}
        >
          {disabled ? (
            <ActivityIndicator size="small" color={palette.subText} />
          ) : (
            <Text style={styles.friendGhostButtonText}>Anuluj</Text>
          )}
        </TouchableOpacity>
      );
    } else if (relation.type === 'incoming') {
      action = (
        <TouchableOpacity
          onPress={() => handleRespondFromSearch(relation.friendshipId, displayName)}
          style={styles.friendGhostButton}
        >
          <Text style={styles.friendGhostButtonText}>Odpowiedz</Text>
        </TouchableOpacity>
      );
    } else if (relation.type === 'blocked') {
      action = (
        <View style={styles.friendStatusPill}>
          <Icon name="lock-closed" size={14} color={palette.subText} />
          <Text style={styles.friendStatusPillText}>Unavailable</Text>
        </View>
      );
    }

    return (
      <View style={styles.friendRow}>
        <Image
          source={profile.avatar_url ? { uri: profile.avatar_url } : fallbackAvatar}
          style={styles.friendAvatar}
        />
        <View style={styles.friendRowInfo}>
          <Text style={styles.friendRowName}>{displayName}</Text>
          <Text style={styles.friendRowMeta}>{resolveUsername(profile)}</Text>
        </View>
        <View>{action}</View>
      </View>
    );
  };

  return (
    <>
      <View style={styles.section}>
        <View style={styles.friendHeader}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <View style={styles.friendHeaderMeta}>
            {relationshipsLoading ? <ActivityIndicator size="small" color={palette.primary} /> : null}
            <Text style={styles.friendCounter}>{friendCount}</Text>
          </View>
        </View>

        {acceptanceNotifications.length > 0 ? (
          <View style={styles.friendNotificationCard}>
            <View style={styles.friendNotificationHeader}>
              <Icon name="notifications-outline" size={18} color={palette.primary} />
              <Text style={styles.friendNotificationTitle}>New acceptances</Text>
            </View>
            {acceptanceNotifications.map(item => (
              <View key={item.id} style={styles.friendNotificationRow}>
                <Image
                  source={item.other.avatar_url ? { uri: item.other.avatar_url } : fallbackAvatar}
                  style={styles.friendAvatarSmall}
                />
                <View style={styles.friendNotificationText}>
                  <Text style={styles.friendRowName}>{resolveName(item.other)}</Text>
                  <Text style={styles.friendRowMeta}>
                    accepted your invitation • {formatDate(item.responded_at ?? null)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => safeAction(() => acknowledgeNotification(item.id))}
                  style={styles.friendNotificationAction}
                  disabled={isFriendshipMutating(item.id)}
                >
                  {isFriendshipMutating(item.id) ? (
                    <ActivityIndicator size="small" color={palette.primary} />
                  ) : (
                    <Text style={styles.friendNotificationActionText}>OK</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        {incomingRequests.length > 0 ? (
          <View style={styles.friendRequestCard}>
            <Text style={styles.inlineSectionTitle}>Pending invitations</Text>
            {incomingRequests.map(request => (
              <View key={request.id} style={styles.friendRequestRow}>
                <Image
                  source={request.other.avatar_url ? { uri: request.other.avatar_url } : fallbackAvatar}
                  style={styles.friendAvatar}
                />
                <View style={styles.friendRowInfo}>
                  <Text style={styles.friendRowName}>{resolveName(request.other)}</Text>
                  <Text style={styles.friendRowMeta}>waiting for response</Text>
                </View>
                <View style={styles.friendRequestActions}>
                  <TouchableOpacity
                    onPress={() => safeAction(() => declineInvite(request.id))}
                    style={[styles.friendGhostButton, styles.friendRequestAction]}
                    disabled={isFriendshipMutating(request.id)}
                  >
                    {isFriendshipMutating(request.id) ? (
                      <ActivityIndicator size="small" color={palette.subText} />
                    ) : (
                      <Text style={styles.friendGhostButtonText}>Decline</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => safeAction(() => acceptInvite(request.id))}
                    style={[styles.friendPrimaryButton, styles.friendRequestAction]}
                    disabled={isFriendshipMutating(request.id)}
                  >
                    {isFriendshipMutating(request.id) ? (
                      <ActivityIndicator size="small" color={palette.onPrimary} />
                    ) : (
                      <Text style={styles.friendPrimaryButtonText}>Accept</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.friendPreviewGrid}>
          {friendsPreview.length === 0 ? (
            <Text style={styles.friendPreviewEmpty}>You don't have any friends yet.</Text>
          ) : (
            friendsPreview.map(entry => {
              const username = resolveUsername(entry.profile);
              return (
                <TouchableOpacity 
                    key={entry.friendshipId} 
                    style={styles.friendPreviewCard}
                    onPress={() => handleOpenChat(entry.profile.id)}
                    activeOpacity={0.8}
                >
                  <Image
                    source={entry.profile.avatar_url ? { uri: entry.profile.avatar_url } : fallbackAvatar}
                    style={styles.friendAvatarSmall}
                  />
                  <View style={styles.friendPreviewText}>
                    <Text style={styles.friendPreviewName}>{resolveName(entry.profile)}</Text>
                    {username ? <Text style={styles.friendPreviewMeta}>{username}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        {friendCount > PREVIEW_LIMIT ? (
          <Text style={styles.friendPreviewMore}>+{friendCount - PREVIEW_LIMIT} more friends</Text>
        ) : null}

        <View style={styles.friendActionsRow}>
          <TouchableOpacity
            style={styles.friendSecondaryButton}
            activeOpacity={0.85}
            onPress={() => setFriendsModalVisible(true)}
          >
            <Icon name="people-outline" size={16} color={palette.text} />
            <Text style={styles.friendSecondaryText}>View friends</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.friendSecondaryButton, styles.friendSecondaryButtonLast]}
            activeOpacity={0.85}
            onPress={openFinderModal}
          >
            <Icon name="person-add-outline" size={16} color={palette.text} />
            <Text style={styles.friendSecondaryText}>Find friends</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal transparent animationType="fade" visible={friendsModalVisible} onRequestClose={closeFriendsModal}>
        <View style={styles.friendModalOverlay}>
          <View style={styles.friendModalCard}>
            <View style={styles.friendModalHeader}>
              <Text style={styles.friendModalTitle}>Your friends ({friendCount})</Text>
              <TouchableOpacity onPress={closeFriendsModal} style={styles.friendModalClose}>
                <Icon name="close" size={20} color={palette.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.friendSearchBar}>
              <Icon name="search-outline" size={18} color={palette.subText} style={styles.friendSearchIcon} />
              <TextInput
                value={friendsFilter}
                onChangeText={setFriendsFilter}
                placeholder="Filter by name or username"
                placeholderTextColor={palette.subText}
                style={styles.friendSearchInput}
              />
            </View>
            {filteredFriends.length === 0 ? (
              <Text style={[styles.friendListEmpty, { marginTop: 20 }]}>No matches.</Text>
            ) : (
              <FlatList
                data={filteredFriends}
                keyExtractor={item => item.friendshipId}
                renderItem={renderFriendRow}
                style={styles.friendModalList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={finderModalVisible} onRequestClose={closeFinderModal}>
        <View style={styles.friendModalOverlay}>
          <View style={styles.friendModalCard}>
            <View style={styles.friendModalHeader}>
              <Text style={styles.friendModalTitle}>Find new friends</Text>
              <TouchableOpacity onPress={closeFinderModal} style={styles.friendModalClose}>
                <Icon name="close" size={20} color={palette.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.friendSearchBar}>
              <Icon name="search-outline" size={18} color={palette.subText} style={styles.friendSearchIcon} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Enter username"
                placeholderTextColor={palette.subText}
                style={styles.friendSearchInput}
                autoFocus
              />
              {searchLoading ? <ActivityIndicator size="small" color={palette.primary} /> : null}
            </View>
            {availableCandidates.length === 0 && !searchLoading ? (
              <Text style={[styles.friendListEmpty, { marginTop: 20 }]}>
                No users match the search.
              </Text>
            ) : (
              <FlatList
                data={availableCandidates}
                keyExtractor={item => item.profile.id}
                renderItem={({ item }) => renderFinderRow(item)}
                style={styles.friendModalList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};