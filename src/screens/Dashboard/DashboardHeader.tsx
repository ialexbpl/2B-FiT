// DashboardHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type DashboardHeaderProps = {
  activeTab: 'home' | 'user-posts' | 'community';
  onTabChange: (tab: 'home' | 'user-posts' | 'community') => void;
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ activeTab, onTabChange }) => {
  const { palette } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: palette.background,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
      paddingTop: 8,
      paddingBottom: 8,
    },
    titleContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: palette.text,
    },
    tabsContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      paddingHorizontal: 16,
    },
    tab: {
      alignItems: 'center' as const,
      paddingVertical: 8,
      flex: 1,
    },
    tabText: {
      fontSize: 11,
      marginTop: 4,
      fontWeight: '400' as const,
    },
    activeTabText: {
      fontWeight: '600' as const,
    },
  });

  return (
    <View style={styles.container}>
    
      {/* Tabs - 3 entries */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabChange('home')}
        >
          <Ionicons
            name="grid"
            size={20}
            color={activeTab === 'home' ? palette.primary : palette.subText}
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'home' ? palette.primary : palette.subText },
            activeTab === 'home' && styles.activeTabText
          ]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabChange('user-posts')}
        >
          <Ionicons
            name="person"
            size={20}
            color={activeTab === 'user-posts' ? palette.primary : palette.subText}
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'user-posts' ? palette.primary : palette.subText },
            activeTab === 'user-posts' && styles.activeTabText
          ]}>
            My Posts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabChange('community')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'community' ? palette.primary : palette.subText}
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'community' ? palette.primary : palette.subText },
            activeTab === 'community' && styles.activeTabText
          ]}>
            Community
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};
