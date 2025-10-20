import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

// Stats screen placeholder — charts and progress tracking will live here.
export const Stats: React.FC = () => {
  const { palette } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>
      <Text style={{ color: palette.text }}>Stats</Text>
    </SafeAreaView>
  );
};

export default Stats;
