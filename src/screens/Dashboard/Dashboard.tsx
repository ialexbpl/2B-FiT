import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

// Dashboard screen placeholder — I’ll build the main overview here.
export const Dashboard: React.FC = () => {
  const { palette } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>










      
      <Text style={{ color: palette.text }}>Dashboard</Text>




















    </SafeAreaView>
  );
};

export default Dashboard;
