// App.tsx
import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootTabs } from '@navigation/RootTabs';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import Login from '@screens/Login/Login';
import { useRivalryNotifications } from './src/hooks/useRivalryNotifications';

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Component to initialize rivalry notifications when logged in
function RivalryNotificationHandler() {
  useRivalryNotifications();
  return null;
}

function AppShell() {
  const { isDark, palette } = useTheme();
  const { isLoggedIn, isLoading } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ProfileProvider>
        <NavigationContainer>
          {/* Simple gate: you can swap to a Stack later if desired */}
          {isLoading ? null : isLoggedIn ? (
            <>
              <RivalryNotificationHandler />
              <RootTabs />
            </>
          ) : (
            <Login />
          )}
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaView>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  }, []);

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
