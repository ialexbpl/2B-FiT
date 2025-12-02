// Dashboard.tsx - pager with Home, My Posts, Community (blog removed)
import React, { useMemo, useState, useRef, useCallback } from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@context/ThemeContext';

import { DashboardHome } from './DashboardHome';
import { UserPostsSection } from './community/UserPostsSection';
import { CommunityFeedSection } from './community/CommunityFeedSection';
import { DashboardHeader } from './DashboardHeader';

const PagerView = Platform.OS === 'web' ? null : require('react-native-pager-view').default;

export const Dashboard: React.FC = () => {
  const { palette } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<any>(null);
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

      if (PagerView && pagerRef.current && pageIndex !== undefined) {
        pagerRef.current.setPage(pageIndex);
      }
    },
    [PagerView]
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

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome />;
      case 'user-posts':
        return <UserPostsSection availableHeight={pageHeight} />;
      case 'community':
      default:
        return (
          <CommunityFeedSection
            availableHeight={pageHeight}
            onEnablePagerView={enablePagerView}
          />
        );
    }
  };

  // Web fallback: PagerView is native-only, so render active tab directly.
  if (Platform.OS === 'web' || !PagerView) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
        <DashboardHeader activeTab={activeTab} onTabChange={handleTabChange} />
        <View style={{ flex: 1 }}>
          {renderActiveContent()}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <DashboardHeader activeTab={activeTab} onTabChange={handleTabChange} />

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
        // Disable swipe paging so vertical scrolling inside sections (Home/My Posts/Community) doesn't jump pages.
        scrollEnabled={false}
        orientation="horizontal"
        overdrag={false}
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
