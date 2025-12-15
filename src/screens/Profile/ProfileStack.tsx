
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Importy
import { Dashboard } from '@screens/Dashboard/Dashboard';
import UserProfileScreen from '@screens/Dashboard/community/UserProfileScreen'; 
import UserChatScreen from '@screens/Profile/UserChatScreen'; 

const DashboardStack = createStackNavigator();


export type DashboardStackParamList = {
  DashboardMain: undefined;
  UserProfileFeed: { userId: string };
  UserChatScreen: { friendId: string };
};

const DashboardStackNavigator: React.FC = () => {
  return (
    <DashboardStack.Navigator 
        screenOptions={{ headerShown: false }}
    >
      {/* 1. GŁÓWNY EKRAN TABA */}
      <DashboardStack.Screen 
        name="DashboardMain" 
        component={Dashboard} 
      />
      
      {/* 2. EKRAN CZATU (UserChatScreen) */}
      <DashboardStack.Screen 
        name="UserChatScreen" 
        component={UserChatScreen} 
        options={{ 
            headerShown: true, 
            title: 'Czat' 
        }}
      />
      
      {/* 3. EKRAN PROFILU UŻYTKOWNIKA (UserProfileFeed) */}
      <DashboardStack.Screen 
        name="UserProfileFeed" 
        component={UserProfileScreen} 
        options={{ 
            headerShown: true, 
            title: 'Profil Użytkownika' 
        }}
      />
      
    </DashboardStack.Navigator>
  );
};

export default DashboardStackNavigator;