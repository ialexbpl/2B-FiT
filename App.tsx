import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootTabs } from '@navigation/RootTabs';
import { ThemeProvider } from './src/context/ThemeContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { useTheme } from './src/context/ThemeContext';

/*
  App root
  - I wrap the whole app in SafeAreaProvider/SafeAreaView so layouts
    respect device notches and insets on iOS/Android.
  - NavigationContainer holds the navigation state for the app.
  - RootTabs renders my bottom tabs: Dashboard, Meals, AI, Stats, Profile.
  - Everything is Expo Go–compatible, no custom native code required.
*/

function AppShell() {
  const { isDark, palette } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ProfileProvider>
        <NavigationContainer>
          <RootTabs />
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
