// DashboardHome keeps your existing widgets inside an inner ScrollView.
// We enable nestedScrollEnabled so it can scroll inside the outer pager FlatList.
import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { makeDashboardStyles } from './DashboardStyles';
import { SearchBar } from './SearchBar';
import { StepsCard } from './StepsCard';
import { WeightCard } from './WeightCard';
import { SleepChart } from './SleepChart';
import { FoodIntake } from './FoodIntake';

export const DashboardHome: React.FC = () => {
  const { palette, theme } = useTheme();
  const styles = useMemo(() => makeDashboardStyles(palette, theme), [palette, theme]);

  return (
    // Inner scroll area of the first page (Home)
  
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 16 }}
      nestedScrollEnabled
    >
      <SearchBar styles={styles} palette={palette} />
      <View style={styles.statsRow}>
        <StepsCard styles={styles} palette={palette} />
        <WeightCard styles={styles} palette={palette} />
      </View>
      <SleepChart styles={styles} palette={palette} />
      <FoodIntake styles={styles} palette={palette} />
    </ScrollView>
  );
};

export default DashboardHome;
