import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Profile screen placeholder — account and settings will go here.
export const Profile: React.FC = () => (
  <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Profile</Text>
  </SafeAreaView>
);

export default Profile;
