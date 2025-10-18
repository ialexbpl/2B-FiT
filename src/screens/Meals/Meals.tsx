import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Meals screen placeholder — meal list, search, and actions will go here.
export const Meals: React.FC = () => (
  <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Meals</Text>
  </SafeAreaView>
);

export default Meals;
