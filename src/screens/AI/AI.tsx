import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

// AI screen placeholder — I’ll connect AI features/actions from here.
//  Write between safeareaview
export const AI: React.FC = () => {
  const { palette } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>

















      
      <Text style={{ color: palette.text }}>AI</Text>







































    </SafeAreaView>
  );
};

export default AI;
