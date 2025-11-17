// Dashboard.tsx
import React, { useMemo, useState, useRef } from 'react';
import { View, FlatList, ListRenderItemInfo, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@context/ThemeContext';

// poprawione importy z pełną ścieżką
import { DashboardHome } from './DashboardHome'; // ← DODAJ TEN IMPORT
import { UserPostsSection } from './community/UserPostsSection.tsx';
import { CommunityFeedSection } from './community/CommunityFeedSection.tsx';
import { DashboardHeader } from './DashboardHeader.tsx';
import { BlogSection } from './blog/BlogSection';

export const Dashboard: React.FC = () => {
  const { palette } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [activeTab, setActiveTab] = useState<'home' | 'user-posts' | 'community' | 'blog'>('home');
  const data = useMemo(() => ['home', 'user-posts', 'community', 'blog'] as const, []);

  const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 90;
  const pageHeight = Math.max(480, height - HEADER_HEIGHT - insets.bottom);

  const handleTabChange = (tab: 'home' | 'user-posts' | 'community' | 'blog') => {
    setActiveTab(tab);
    const index = data.indexOf(tab);
    if (flatListRef.current && index >= 0) {
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0,
        });
      } catch (e) {
        console.warn('Scroll error:', e);
      }
    }
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const currentIndex = Math.round(offsetY / pageHeight);
    if (currentIndex >= 0 && currentIndex < data.length) {
      setActiveTab(data[currentIndex]);
    }
  };

  const renderItem = ({ item }: ListRenderItemInfo<typeof data[number]>) => (
    <View style={{ height: pageHeight }}>
      {item === 'home' ? (
        <DashboardHome />
      ) : item === 'user-posts' ? (
        <UserPostsSection availableHeight={pageHeight} />
      ) : item === 'community' ? (
        <CommunityFeedSection availableHeight={pageHeight} />
      ) : (
        <BlogSection availableHeight={pageHeight} />
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <DashboardHeader activeTab={activeTab} onTabChange={handleTabChange} />

      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(k) => k}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        bounces={false}
        snapToInterval={pageHeight}
        snapToAlignment="start"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: pageHeight,
          offset: pageHeight * index,
          index,
        })}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
};

export default Dashboard;