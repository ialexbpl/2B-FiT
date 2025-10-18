import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Dashboard screen placeholder — I’ll build the main overview here.
export const Dashboard: React.FC = () => (
  <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Dashboard</Text>
  </SafeAreaView>
);

export default Dashboard;
