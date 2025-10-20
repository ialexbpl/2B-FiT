import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

// Meals screen placeholder — meal list, search, and actions will go here.
export const Meals: React.FC = () => {
  const { palette } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>





















      
      <Text style={{ color: palette.text }}>Meals</Text>



























    </SafeAreaView>
  );
};

export default Meals;
