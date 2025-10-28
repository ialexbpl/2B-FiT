// src/screens/Stats/Stats.tsx
import React from 'react';
import { Text, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import Calendar from '../Calendar/Calendar'; // dostosuj ścieżkę, jeśli masz alias @screens

export const Stats: React.FC = () => {
  const { palette } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }} >
        <Calendar />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Stats;
