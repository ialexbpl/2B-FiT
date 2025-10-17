import React from 'react';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';
import { Login } from './src/screens/Login/Login';

export default function App() {
  const isDark = useColorScheme() === 'dark';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Login />
    </SafeAreaView>
  );
}

