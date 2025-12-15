import React from 'react';
import { ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Calendar from './Calendar/Calendar';
import WeeklyStatsCard from './WeeklyStatsCard';

export const Stats: React.FC = () => {
  const { palette } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.background }}>
      <Calendar />
      <WeeklyStatsCard />
    </ScrollView>
  );
};

export default Stats;
