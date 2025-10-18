import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootTabs } from '@navigation/RootTabs';

/*
  App root
  - I wrap the whole app in SafeAreaProvider/SafeAreaView so layouts
    respect device notches and insets on iOS/Android.
  - NavigationContainer holds the navigation state for the app.
  - RootTabs renders my bottom tabs: Dashboard, Meals, AI, Stats, Profile.
  - Everything is Expo Go–compatible, no custom native code required.
*/

export default function App() {
  const isDark = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <NavigationContainer>
          <RootTabs />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
