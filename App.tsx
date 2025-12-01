// App.tsx
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootTabs } from '@navigation/RootTabs';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import Login from '@screens/Login/Login';

function AppShell() {
  const { isDark, palette } = useTheme();
  const { isLoggedIn, isLoading } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ProfileProvider>
        <NavigationContainer>
          {/* Simple gate: you can swap to a Stack later if desired */}
          {isLoading ? null : isLoggedIn ? <RootTabs /> : <Login />}
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
