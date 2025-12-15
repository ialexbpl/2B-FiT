import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Pressable, View, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Dashboard } from '@screens/Dashboard/Dashboard';
import Meals from '@screens/Meals/Meals';
import RecipeDetailScreen from '@screens/Meals/RecipeDetailScreen';
import AddRecipeScreen from '@screens/Meals/AddRecipeScreen';
import { AI } from '@screens/AI/AI';
import { Stats } from '@screens/Stats/Stats';
import { Profile } from '@screens/Profile/Profile';
import { Setting } from '@screens/Settings/Setting';
import Scanner from '@screens/Meals/Scanner/Scanner';
import UserProfileScreen from '@screens/Dashboard/community/UserProfileScreen';

import { useTheme } from '../context/ThemeContext';
import { supabase } from '@utils/supabase';
import { fetchProfileSettings } from '@utils/profileSettingsApi';
import SurveyScreen from '@screens/Login/Onboarding/SurveyScreen';


/*
  Bottom tabs (my main navigation)
  - Order: Dashboard, Meals, AI (center, floating), Stats, Profile.
  - I use Ionicons from @expo/vector-icons for simple, recognizable icons.
  - The AI tab is a custom raised button to make it stand out.
  - Kept headers off here; screens will add their own UI as needed.
*/

const Tab = createBottomTabNavigator();

function AITabButton({ onPress, accessibilityState }: any) {
  const { theme, palette } = useTheme();
  const focused = accessibilityState?.selected;
  return (
    <Pressable
      onPress={onPress}
      style={{
        top: -12,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      accessibilityRole="button"
      accessibilityLabel="AI"
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: focused ? theme.colors.primary : '#afb3bbff',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons name="flask" size={24} color="#fff" />
      </View>
      <Text style={{ fontSize: 12, marginTop: 2, color: focused ? theme.colors.primary : palette.subText }}>AI</Text>
    </Pressable>
  );
}

export function RootTabs() {
  const { theme, palette } = useTheme();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) {
            setHasProfile(false);
            setCheckingProfile(false);
          }
          return;
        }

        const profile = await fetchProfileSettings(user.id);
        if (!cancelled) {
          const completed = Boolean(
            profile &&
              profile.sex &&
              profile.age && profile.age > 0 &&
              profile.height_cm && profile.height_cm > 0 &&
              profile.weight_kg && profile.weight_kg > 0 &&
              profile.goal_weight_kg && profile.goal_weight_kg > 0 &&
              profile.activity_level &&
              Array.isArray(profile.allergies) &&
              profile.allergies.length > 0
          );

          setHasProfile(completed);
        }
      } catch (e) {
        console.warn('Failed to fetch profile settings', e);
        if (!cancelled) {
          // If we cannot load settings, force onboarding to collect required data
          setHasProfile(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingProfile(false);
        }
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  if (checkingProfile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!hasProfile) {
    return (
      <SurveyScreen
        onCompleted={() => setHasProfile(true)}
      />
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: palette.subText,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<string, [any, string]> = {
            Dashboard: [Ionicons, focused ? 'home' : 'home-outline'],
            Meals: [Ionicons, focused ? 'restaurant' : 'restaurant-outline'],
            Stats: [Ionicons, focused ? 'bar-chart' : 'bar-chart-outline'],
            Profile: [Ionicons, focused ? 'person' : 'person-outline'],
          };
          const entry = map[route.name];
          if (!entry) return null;
          const [Icon, iconName] = entry;
          return <Icon name={iconName as any} size={size} color={color} />;
        },
      })}
  >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen
      name="Meals" 
      component={Meals} 
      options={{ title: "Meals" }} 
      />
      <Tab.Screen
        name="AI"
        component={AI}
        options={{
          tabBarButton: (props) => <AITabButton {...props} />,
          tabBarLabel: 'AI',
        }}
      />
      <Tab.Screen name="Stats" component={Stats} />
      <Tab.Screen name="Profile" component={Profile} />
      <Tab.Screen
        name="Settings"
        component={Setting}
        options={{
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
        }}
      />
        <Tab.Screen
        name="Scanner"
        component={Scanner}
        options={{ tabBarButton: () => null, headerShown: false }}
      />
      <Tab.Screen
        name="UserProfileFeed"
        component={UserProfileScreen}
        options={{
          tabBarButton: () => null,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{
          tabBarButton: () => null,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="AddRecipe"
        component={AddRecipeScreen}
        options={{
          tabBarButton: () => null,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}
