// Dashboard.tsx - pager with Home, My Posts, Community (blog removed)
import React, { useMemo, useState, useRef, useCallback } from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@context/ThemeContext';
import PagerView from 'react-native-pager-view';

import { DashboardHome } from './DashboardHome';
import { UserPostsSection } from './community/UserPostsSection';
import { CommunityFeedSection } from './community/CommunityFeedSection';
import { DashboardHeader } from './DashboardHeader';

export const Dashboard: React.FC = () => {
  const { palette } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<PagerView>(null);
  const [pagerEnabled, setPagerEnabled] = useState(true);

  const [activeTab, setActiveTab] = useState<'home' | 'user-posts' | 'community'>('home');

  const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 90;
  const pageHeight = Math.max(480, height - HEADER_HEIGHT - insets.bottom);

  /** Change tab via PagerView */
  const handleTabChange = useCallback(
    (tab: 'home' | 'user-posts' | 'community') => {
      setActiveTab(tab);

      const pageIndex = {
        'home': 0,
        'user-posts': 1,
        'community': 2,
      }[tab];

      if (pagerRef.current && pageIndex !== undefined) {
        pagerRef.current.setPage(pageIndex);
      }
    },
    []
  );

  /** Update active tab when user swipes the pager */
  const handlePageSelected = useCallback((event: any) => {
    const pageIndex = event.nativeEvent.position;
    const tabs: ('home' | 'user-posts' | 'community')[] = ['home', 'user-posts', 'community'];
    if (pageIndex >= 0 && pageIndex < tabs.length) {
      setActiveTab(tabs[pageIndex]);
      // Disable pager on community page
      setPagerEnabled(tabs[pageIndex] !== 'community');
    }
  }, []);

  // Function to enable pager view again (called from CommunityFeedSection)
  const enablePagerView = useCallback(() => {
    setPagerEnabled(true);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <DashboardHeader activeTab={activeTab} onTabChange={handleTabChange} />

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
        scrollEnabled={pagerEnabled}
        orientation="vertical"
        overdrag={true}
        keyboardDismissMode="on-drag"
      >
      {/* Home section - Page 0 */}
        <View key="0" style={{ flex: 1 }}>
          <DashboardHome />
        </View>

        {/* My Posts section - Page 1 */}
        <View key="1" style={{ flex: 1 }}>
          <UserPostsSection availableHeight={pageHeight} />
        </View>

        {/* Community section - Page 2 */}
        <View key="2" style={{ flex: 1 }}>
          <CommunityFeedSection 
            availableHeight={pageHeight} 
            onEnablePagerView={enablePagerView}
          />
        </View>

      </PagerView>
    </SafeAreaView>
  );
};

export default Dashboard;
