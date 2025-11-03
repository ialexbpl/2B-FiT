// App.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootTabs } from '@navigation/RootTabs';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import Login from '@screens/Login/Login';
import * as SplashScreen from 'expo-splash-screen';

void SplashScreen.preventAutoHideAsync();

type AppShellProps = {
  onReadyLayout: () => void;
};

function AppShell({ onReadyLayout }: AppShellProps) {
  const { isDark, palette } = useTheme();
  const { isLoggedIn, isLoading } = useAuth();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.background }}
      onLayout={onReadyLayout}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ProfileProvider>
        <NavigationContainer>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>
            <ActivityIndicator />
          </View>
        ) : isLoggedIn ? (
          <RootTabs />
        ) : (
          <Login />
        )}
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaView>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Tu ładujemy czcionki / init DB / tokeny / motyw itp.
        // await Font.loadAsync(...); await initDb(); await restoreSession(); itd.
        await new Promise(resolve => setTimeout(resolve, 600)); // Symulacja ładowania
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    };

    void prepare();
  }, []);


  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppShell onReadyLayout={onLayoutRootView} />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
