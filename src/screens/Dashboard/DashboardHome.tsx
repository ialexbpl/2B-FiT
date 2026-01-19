import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  SectionList,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@context/AuthContext';

import { makeDashboardStyles } from './DashboardStyles';
import { SearchBar } from './SearchBar';
import { StepsCard } from './StepsCard';
import { WeightCard } from './WeightCard';
import { SleepChart } from './SleepChart';
import { FoodIntake } from './FoodIntake';
import { WaterIntakeCard } from './WaterIntakeCard';
import { FindGym } from './FindGym';

import { searchUsers, type UserSearchResult } from '../../api/userService';

type ActiveView = 
  | { type: 'WIDGETS_OR_LIST' } 
  | { type: 'FIND_GYM' };

const localStyles = StyleSheet.create({
  loadingText: { textAlign: 'center', marginTop: 30, fontSize: 16 },
  noResultsText: { textAlign: 'center', marginTop: 30, fontSize: 16 },
  flatlistContainer: { flex: 1, paddingHorizontal: 16 },
  screen: { flex: 1 },
  sectionHeader: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarImage: { width: 40, height: 40, borderRadius: 20 },
  userTextWrapper: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600' },
  userHandle: { fontSize: 12 },
});

export const DashboardHome: React.FC = () => {
  const { palette, theme } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const styles = useMemo(() => makeDashboardStyles(palette, theme), [palette, theme]);

  const [activeView, setActiveView] = useState<ActiveView>({ type: 'WIDGETS_OR_LIST' });

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  const loadUsers = useCallback(
    async (query: string) => {
      if (query.trim() === '') {
        setUsers([]);
        return;
      }
      setUserLoading(true);
      try {
        const results = await searchUsers(query, session?.user?.id);
        setUsers(results);
      } catch (error) {
        console.error('Error while loading users:', error);
        setUsers([]);
      } finally {
        setUserLoading(false);
      }
    },
    [session?.user?.id]
  );

  useEffect(() => {
    const normalized = searchQuery.trim();
    if (normalized.length === 0) {
      setUsers([]);
      return;
    }
    loadUsers(normalized);
  }, [searchQuery, loadUsers]);

  const handleUserPress = (user: UserSearchResult) => {
    navigation.navigate('UserProfileFeed', {
      userId: user.id,
      username: user.full_name || user.username,
      from: 'Dashboard',
    });
  };

  const handleOpenFindGym = () => {
    setActiveView({ type: 'FIND_GYM' });
  };

  const handleCloseFindGym = () => {
    setActiveView({ type: 'WIDGETS_OR_LIST' });
  };

  const isSearching = searchQuery.trim().length > 0;

  // Show FindGym screen
  if (activeView.type === 'FIND_GYM') {
    return <FindGym onClose={handleCloseFindGym} />;
  }

  const renderUserItem = (user: UserSearchResult) => (
    <TouchableOpacity
      onPress={() => handleUserPress(user)}
      style={[localStyles.userRow, { borderBottomColor: palette.border }]}
      activeOpacity={0.85}
    >
      <View style={[localStyles.userAvatar, { backgroundColor: palette.card }]}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={localStyles.userAvatarImage} />
        ) : (
          <Ionicons name="person" size={18} color={palette.subText} />
        )}
      </View>
      <View style={localStyles.userTextWrapper}>
        <Text style={[localStyles.userName, { color: palette.text }]}>
          {user.full_name || user.username || 'User'}
        </Text>
        {user.username ? (
          <Text style={[localStyles.userHandle, { color: palette.subText }]}>
            @{user.username}
          </Text>
        ) : null}
      </View>
      <Ionicons name="arrow-forward" size={18} color={palette.subText} />
    </TouchableOpacity>
  );

  const renderSearchResults = () => {
    if (userLoading) {
      return <ActivityIndicator size="large" color={palette.primary} style={localStyles.loadingText} />;
    }

    if (!userLoading && searchQuery.trim().length > 0 && users.length === 0) {
      return (
        <Text style={[localStyles.noResultsText, { color: palette.subText }]}>
          Nie znaleziono użytkowników dla "{searchQuery}".
        </Text>
      );
    }

    if (users.length === 0) {
      return (
        <Text style={[localStyles.noResultsText, { color: palette.subText }]}>
          Wpisz frazę aby wyszukać użytkowników.
        </Text>
      );
    }

    return (
      <SectionList
        sections={[{ title: 'Users', data: users }]}
        keyExtractor={(item, index) => `user-${item.id}-${index}`}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => renderUserItem(item)}
        renderSectionHeader={({ section }) => (
          <Text style={[localStyles.sectionHeader, { color: palette.subText }]}>
            Użytkownicy ({users.length})
          </Text>
        )}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    );
  };

  const renderDashboardWidgets = () => (
    <>
      {/* Find Gym Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleOpenFindGym}
        style={{ marginBottom: 16 }}
      >
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rivalryCard}
        >
          <View style={styles.rivalryTop}>
            <View style={styles.rivalryCopy}>
              <Text style={styles.rivalryTitle}>Znajdź Siłownię</Text>
              <Text style={styles.rivalrySubtitle}>
                Wyszukaj siłownie w pobliżu i filtruj od najbliższych.
              </Text>
            </View>
            <View style={styles.rivalryBadge}>
              <Ionicons name="fitness" size={26} color="#fff" />
            </View>
          </View>
          <View style={styles.rivalryCta}>
            <Text style={styles.rivalryCtaText}>Szukaj siłowni</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Rivalry Card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Rivalry')}
        style={{ marginBottom: 16 }}
      >
        <LinearGradient
          colors={[theme.colors.primary, '#16a34a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rivalryCard}
        >
          <View style={styles.rivalryTop}>
            <View style={styles.rivalryCopy}>
              <Text style={styles.rivalryTitle}>Rivalry</Text>
              <Text style={styles.rivalrySubtitle}>
                Jump into weekly challenges, track your rank, and invite friends to compete.
              </Text>
            </View>
            <View style={styles.rivalryBadge}>
              <Ionicons name="trophy" size={26} color="#fff" />
            </View>
          </View>
          <View style={styles.rivalryCta}>
            <Text style={styles.rivalryCtaText}>Open rivalry</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <StepsCard styles={styles} palette={palette} />
        <WeightCard styles={styles} palette={palette} />
      </View>
      <SleepChart styles={styles} palette={palette} />
      <FoodIntake styles={styles} palette={palette} />
      <WaterIntakeCard styles={styles} palette={palette} />
    </>
  );

  return (
    <View style={localStyles.screen}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <SearchBar
          styles={styles}
          palette={palette}
          query={searchQuery}
          onSearch={setSearchQuery}
        />
      </View>

      {isSearching ? (
        <View style={localStyles.flatlistContainer}>
          {renderSearchResults()}
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          nestedScrollEnabled
        >
          {renderDashboardWidgets()}
        </ScrollView>
      )}
    </View>
  );
};
