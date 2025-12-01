import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, ScrollView, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';

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


type ActiveView = { type: 'WIDGETS_OR_LIST' } | { type: 'DETAILS', gymId: string };

const localStyles = StyleSheet.create({
  loadingText: { textAlign: 'center', marginTop: 30, fontSize: 16 },
  noResultsText: { textAlign: 'center', marginTop: 30, fontSize: 16 },
  flatlistContainer: { flex: 1, paddingHorizontal: 16 },
  screen: { flex: 1 }
});


export const DashboardHome: React.FC = () => {
  const { palette, theme } = useTheme();
  const styles = useMemo(() => makeDashboardStyles(palette, theme), [palette, theme]);
  
  
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'WIDGETS_OR_LIST' });

  
  const [searchQuery, setSearchQuery] = useState('');
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);

  const loadGyms = useCallback(async (query: string) => {
    if (query.trim() === '') {
      setGyms([]);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchGyms(query);
      setGyms(result);
    } catch (error) {
      console.error("Error while loading gyms:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    
    if (searchQuery.length > 2 || searchQuery.length === 0) {
        loadGyms(searchQuery);
    }
  }, [searchQuery, loadGyms]);
  
  const handleGymPress = (gym: Gym) => {
    setActiveView({ type: 'DETAILS', gymId: gym.id });
  };
  
  // Function to return from the details screen
  const handleCloseDetails = () => {
    setActiveView({ type: 'WIDGETS_OR_LIST' });
  };


  const isSearching = searchQuery.length > 0;


  
  if (activeView.type === 'DETAILS') {
    return (
     
      <GymDetailsScreen 
        gymId={activeView.gymId} 
        onClose={handleCloseDetails} 
      />
    );
  }


  
  
  const renderSearchResults = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={palette.primary} style={localStyles.loadingText} />;
    }
    
    if (gyms.length === 0 && searchQuery.length > 2) {
      return (
        <Text style={[localStyles.noResultsText, { color: palette.subText }]}>
          No gyms match the query "{searchQuery}".
        </Text>
      );
    }

    return (
      <FlatList
        data={gyms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GymListItem 
            gym={item} 
            onPress={handleGymPress} // Pass function to navigate to the DETAILS view
          />
        )}
        style={{ flex: 1 }}
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
    </>
  );


  return (
    <View style={localStyles.screen}> 
      {/* SearchBar is always at the top */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <SearchBar 
            styles={styles} 
            palette={palette} 
            query={searchQuery}
            onSearch={setSearchQuery} 
        />
      </View>

      {/* Conditional rendering: search results OR original content */}
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