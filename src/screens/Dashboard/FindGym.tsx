import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useLocation } from '../../hooks/useLocation';
import {
  searchNearbyGyms,
  formatDistance,
  type GooglePlaceGym,
} from '../../api/googlePlacesService';

interface FindGymProps {
  onClose: () => void;
}

export const FindGym: React.FC<FindGymProps> = ({ onClose }) => {
  const { palette } = useTheme();
  const { location, loading: locationLoading, error: locationError, requestLocation } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [gyms, setGyms] = useState<GooglePlaceGym[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGym, setSelectedGym] = useState<GooglePlaceGym | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce search
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search for gyms when query changes or location is available
  const searchGyms = useCallback(async (keyword?: string) => {
    // Request location if not available
    let loc = location;
    if (!loc) {
      setLoading(true);
      loc = await requestLocation();
      if (!loc) {
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setHasSearched(true);
    try {
      // If no keyword, search for generic "gym" or "siłownia"
      const searchKeyword = keyword?.trim() || 'gym';
      const results = await searchNearbyGyms(loc.latitude, loc.longitude, searchKeyword, 10000);
      setGyms(results);
    } catch (error) {
      console.error('Error searching gyms:', error);
      setGyms([]);
    } finally {
      setLoading(false);
    }
  }, [location, requestLocation]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchGyms(debouncedQuery);
    } else if (debouncedQuery.length === 0 && location) {
      // Show nearby gyms when search is empty and we have location
      searchGyms();
    }
  }, [debouncedQuery, location, searchGyms]);

  // Initial load - request location and search
  useEffect(() => {
    searchGyms();
  }, []);

  const handleGymPress = (gym: GooglePlaceGym) => {
    setSelectedGym(gym);
  };

  const handleOpenInMaps = (gym: GooglePlaceGym) => {
    const query = encodeURIComponent(`${gym.name} ${gym.address}`);
    const url = Platform.select({
      ios: `maps:?q=${query}`,
      android: `https://www.google.com/maps/search/?api=1&query=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    backButton: {
      padding: 4,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.text,
    },
    searchContainer: {
      padding: 16,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: palette.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: palette.text,
    },
    clearButton: {
      padding: 4,
    },
    infoText: {
      textAlign: 'center',
      padding: 20,
      color: palette.subText,
      fontSize: 14,
    },
    errorText: {
      textAlign: 'center',
      padding: 20,
      color: '#ef4444',
      fontSize: 14,
    },
    listContainer: {
      flex: 1,
    },
    gymItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    gymInfo: {
      flex: 1,
    },
    gymName: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.text,
      marginBottom: 4,
    },
    gymAddress: {
      fontSize: 13,
      color: palette.subText,
      marginBottom: 6,
    },
    gymMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    },
    distanceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    distanceText: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.primary,
      marginLeft: 4,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      fontSize: 12,
      color: palette.subText,
      marginLeft: 4,
    },
    statusOpen: {
      fontSize: 12,
      color: '#22c55e',
      fontWeight: '500',
    },
    statusClosed: {
      fontSize: 12,
      color: '#ef4444',
      fontWeight: '500',
    },
    chevron: {
      marginLeft: 8,
    },
    // Detail view styles
    detailContainer: {
      flex: 1,
      backgroundColor: palette.background,
    },
    detailContent: {
      padding: 20,
    },
    detailName: {
      fontSize: 24,
      fontWeight: '700',
      color: palette.text,
      marginBottom: 8,
    },
    detailAddress: {
      fontSize: 15,
      color: palette.subText,
      marginBottom: 16,
    },
    detailMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 24,
    },
    detailMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailMetaText: {
      fontSize: 14,
      color: palette.text,
      marginLeft: 6,
    },
    actionButton: {
      backgroundColor: palette.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    resultsCount: {
      fontSize: 13,
      color: palette.subText,
    },
    sortInfo: {
      fontSize: 12,
      color: palette.primary,
      fontWeight: '500',
    },
  }), [palette]);

  // Render gym detail view
  if (selectedGym) {
    return (
      <View style={styles.detailContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedGym(null)}
          >
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Szczegóły siłowni</Text>
        </View>
        <ScrollView style={styles.detailContent}>
          <Text style={styles.detailName}>{selectedGym.name}</Text>
          <Text style={styles.detailAddress}>{selectedGym.address}</Text>

          <View style={styles.detailMeta}>
            {selectedGym.distance !== undefined && (
              <View style={styles.detailMetaItem}>
                <Ionicons name="location" size={18} color={palette.primary} />
                <Text style={styles.detailMetaText}>
                  {formatDistance(selectedGym.distance)}
                </Text>
              </View>
            )}

            {selectedGym.rating && (
              <View style={styles.detailMetaItem}>
                <Ionicons name="star" size={18} color="#FFD700" />
                <Text style={styles.detailMetaText}>
                  {selectedGym.rating.toFixed(1)} ({selectedGym.user_ratings_total || 0} opinii)
                </Text>
              </View>
            )}

            {selectedGym.opening_hours?.open_now !== undefined && (
              <View style={styles.detailMetaItem}>
                <Ionicons
                  name="time"
                  size={18}
                  color={selectedGym.opening_hours.open_now ? '#22c55e' : '#ef4444'}
                />
                <Text style={[
                  styles.detailMetaText,
                  { color: selectedGym.opening_hours.open_now ? '#22c55e' : '#ef4444' }
                ]}>
                  {selectedGym.opening_hours.open_now ? 'Otwarte teraz' : 'Zamknięte'}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenInMaps(selectedGym)}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Otwórz w Mapach</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Render gym list item
  const renderGymItem = ({ item }: { item: GooglePlaceGym }) => (
    <TouchableOpacity
      style={styles.gymItem}
      onPress={() => handleGymPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.gymInfo}>
        <Text style={styles.gymName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.gymAddress} numberOfLines={1}>
          {item.address}
        </Text>
        <View style={styles.gymMeta}>
          {item.distance !== undefined && (
            <View style={styles.distanceBadge}>
              <Ionicons name="location" size={12} color={palette.primary} />
              <Text style={styles.distanceText}>
                {formatDistance(item.distance)}
              </Text>
            </View>
          )}

          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
          )}

          {item.opening_hours?.open_now !== undefined && (
            <Text style={item.opening_hours.open_now ? styles.statusOpen : styles.statusClosed}>
              {item.opening_hours.open_now ? 'Otwarte' : 'Zamknięte'}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={palette.subText} style={styles.chevron} />
    </TouchableOpacity>
  );

  const isLoading = loading || locationLoading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Znajdź siłownię</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={palette.subText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj siłowni (np. CrossFit, gym, fitness...)"
            placeholderTextColor={palette.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={palette.subText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {locationError && (
        <Text style={styles.errorText}>{locationError}</Text>
      )}

      {isLoading && (
        <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 40 }} />
      )}

      {!isLoading && hasSearched && gyms.length === 0 && (
        <Text style={styles.infoText}>
          Nie znaleziono siłowni. Spróbuj zmienić frazę wyszukiwania.
        </Text>
      )}

      {!isLoading && gyms.length > 0 && (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              Znaleziono {gyms.length} siłowni
            </Text>
            <Text style={styles.sortInfo}>
              ↑ Od najbliższych
            </Text>
          </View>
          <FlatList
            data={gyms}
            keyExtractor={(item) => item.place_id}
            renderItem={renderGymItem}
            style={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

