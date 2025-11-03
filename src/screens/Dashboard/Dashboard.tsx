// Dashboard pager: page 1 = Home widgets, page 2 = Blog posts list
// Using FlatList as a full-screen vertical pager avoids the
// "VirtualizedLists nested inside plain ScrollViews" warning and
// gives us native snap paging between sections.
import React, { useMemo } from 'react';
import { View, FlatList, ListRenderItemInfo, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@context/ThemeContext';
import { DashboardHome } from './DashboardHome';
import { BlogSection } from './blog/BlogSection';

export const Dashboard: React.FC = () => {
  const { palette } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const data = useMemo(() => ['home', 'blog'] as const, []);

  // Render each "page" with a fixed container height equal to viewport height.
  // - home: shows the original dashboard content (has its own inner ScrollView)
  // - blog: shows the snapping posts list (FlatList with snapToInterval)
  const TAB_HEIGHT = Platform.OS === 'ios' ? 80 : 64;
  const pageHeight = Math.max(480, height - TAB_HEIGHT - insets.bottom);
  const renderItem = ({ item }: ListRenderItemInfo<typeof data[number]>) => (
    <View style={{ height: pageHeight }}>
      {item === 'home' ? <DashboardHome /> : <BlogSection availableHeight={pageHeight} />}
    </View>
  );

  return (
    
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <FlatList
        data={data}
        keyExtractor={(k) => k}
        renderItem={renderItem}
        // Enable native paging so swiping vertically snaps between pages
        
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        bounces={false}
        // Provide layout hints so FlatList can compute snap offsets cheaply
        getItemLayout={(_, index) => ({ length: pageHeight, offset: pageHeight * index, index })}
        removeClippedSubviews
      />
    </SafeAreaView>
  
  );
};

export default Dashboard;
