// Dashboard.tsx - pager with Home and Community
import React, { useState, useRef, useCallback } from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@context/ThemeContext';

import { DashboardHome } from './DashboardHome';
import { CommunityFeedSection } from './community/CommunityFeedSection';
import { DashboardHeader } from './DashboardHeader';

const PagerView = Platform.OS === 'web' ? null : require('react-native-pager-view').default;

export const Dashboard: React.FC = () => {
  const { palette } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<any>(null);
  const [pagerEnabled, setPagerEnabled] = useState(true);

  const [activeTab, setActiveTab] = useState<'home' | 'community'>('home');

  const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 90;
  const pageHeight = Math.max(480, height - HEADER_HEIGHT - insets.bottom);

  /** Change tab via PagerView */
  const handleTabChange = useCallback(
    (tab: 'home' | 'community') => {
      setActiveTab(tab);
      setPagerEnabled(tab !== 'community');

      const pageIndex = {
        'home': 0,
        'community': 1,
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
    const tabs: ('home' | 'community')[] = ['home', 'community'];
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
        // Disable swipe paging on community page to avoid scroll conflicts.
        scrollEnabled={pagerEnabled}
        orientation="horizontal"
        overdrag={false}
        keyboardDismissMode="on-drag"
      >
      {/* Home section - Page 0 */}
        <View key="0" style={{ flex: 1 }}>
          <DashboardHome />
        </View>

        {/* Community section - Page 1 */}
        <View key="1" style={{ flex: 1 }}>
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
