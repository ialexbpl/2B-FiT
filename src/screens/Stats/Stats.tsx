// src/screens/Stats/Stats.tsx
import React from 'react';
import { Text, ScrollView, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Calendar from '../Calendar/Calendar'; // dostosuj ścieżkę, jeśli masz alias @screens

export const Stats: React.FC = () => {
  const { palette } = useTheme();

  return (
    
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }} >
        <Calendar />










      </ScrollView>
  );
};

export default Stats;
