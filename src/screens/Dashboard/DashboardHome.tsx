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
import { useAuth } from '@context/AuthContext';

import { makeDashboardStyles } from './DashboardStyles';
import { SearchBar } from './SearchBar';
import { StepsCard } from './StepsCard';
import { WeightCard } from './WeightCard';
import { SleepChart } from './SleepChart';
import { FoodIntake } from './FoodIntake';

import { fetchGyms } from '../../api/gymService';
import { Gym } from '../../models/GymModels';
import { GymListItem } from './GymListItem';
import { GymDetailsScreen } from './GymDetailsScreen';
import { searchUsers, type UserSearchResult } from '../../api/userService';

type ActiveView = { type: 'WIDGETS_OR_LIST' } | { type: 'DETAILS'; gymId: string };

type SearchSection =
  | { title: 'Users'; key: 'users'; data: UserSearchResult[] }
  | { title: 'Gyms'; key: 'gyms'; data: Gym[] };

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
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [gymLoading, setGymLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  const loadGyms = useCallback(async (query: string) => {
    if (query.trim() === '') {
      setGyms([]);
      return;
    }
    setGymLoading(true);
    try {
      const result = await fetchGyms(query);
      setGyms(result);
    } catch (error) {
      console.error('Error while loading gyms:', error);
    } finally {
      setGymLoading(false);
    }
  }, []);

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
      setGyms([]);
      setUsers([]);
      return;
    }
    loadGyms(normalized);
    loadUsers(normalized);
  }, [searchQuery, loadGyms, loadUsers]);

  const handleGymPress = (gym: Gym) => {
    setActiveView({ type: 'DETAILS', gymId: gym.id });
  };

  const handleUserPress = (user: UserSearchResult) => {
    navigation.navigate('UserProfileFeed', {
      userId: user.id,
      username: user.full_name || user.username,
    });
  };

  const handleCloseDetails = () => {
    setActiveView({ type: 'WIDGETS_OR_LIST' });
  };

  const isSearching = searchQuery.trim().length > 0;
  const searchLoading = gymLoading || userLoading;

  if (activeView.type === 'DETAILS') {
    return (
      <GymDetailsScreen
        gymId={activeView.gymId}
        onClose={handleCloseDetails}
      />
    );
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
    if (searchLoading) {
      return <ActivityIndicator size="large" color={palette.primary} style={localStyles.loadingText} />;
    }

    if (!searchLoading && searchQuery.trim().length > 0 && gyms.length === 0 && users.length === 0) {
      return (
        <Text style={[localStyles.noResultsText, { color: palette.subText }]}>
          No gyms or users match "{searchQuery}".
        </Text>
      );
    }

    const sections: SearchSection[] = [];
    if (users.length > 0) sections.push({ title: 'Users', key: 'users', data: users });
    if (gyms.length > 0) sections.push({ title: 'Gyms', key: 'gyms', data: gyms });

    if (sections.length === 0) {
      return (
        <Text style={[localStyles.noResultsText, { color: palette.subText }]}>
          Start typing to search gyms or users.
        </Text>
      );
    }

    return (
      <SectionList<UserSearchResult | Gym, SearchSection>
        sections={sections}
        keyExtractor={(item, index) => {
          // Distinguish based on properties
          if ('address' in item) {
            return `gym-${item.id}-${index}`;
          }
          return `user-${item.id}-${index}`;
        }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, section }) => {
          if (section.key === 'users') {
            return renderUserItem(item as UserSearchResult);
          } else {
            return (
              <GymListItem
                gym={item as unknown as Gym}
                onPress={handleGymPress}
              />
            );
          }
        }}
        renderSectionHeader={({ section }) => (
          <Text style={[localStyles.sectionHeader, { color: palette.subText }]}>
            {section.title}
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
      <View style={styles.statsRow}>
        <StepsCard styles={styles} palette={palette} />
        <WeightCard styles={styles} palette={palette} />
      </View>
      <SleepChart styles={styles} palette={palette} />
      <FoodIntake styles={styles} palette={palette} />

      {/* Temporary Link to Rivalry Feature */}
      <View style={{ marginTop: 20 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Rivalry')}
          style={{
            backgroundColor: palette.card,
            padding: 16,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: palette.border
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: theme.colors.primary + '20',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Ionicons name="trophy" size={20} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: palette.text }}>Rywalizacja</Text>
              <Text style={{ fontSize: 13, color: palette.subText }}>Sprawdź rankingi i wyzwania</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={palette.subText} />
        </TouchableOpacity>
      </View>
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
