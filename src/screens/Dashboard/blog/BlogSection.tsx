// BlogSection: vertically snapping list of fixed-height post cards (IG-like).
// Using FlatList with snapToInterval for smooth, consistent snapping per post.
import React, { useMemo, useState } from 'react';
import { View, FlatList, useWindowDimensions, Platform } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { makeBlogStyles } from './BlogStyles';
import { PostCard, type Post } from './PostCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SAMPLE_POSTS: Post[] = [
  {
    id: 'p1',
    title: 'Poranny trening – full body',
    likes: 124,
    comments: [
      { id: 'c1', author: 'Ania', text: 'Świetny plan!' },
      { id: 'c2', author: 'Marek', text: 'Robię jutro 💪' },
    ],
  },
  { id: 'p2', title: 'Przepis: Sałatka białkowa', likes: 87, comments: [{ id: 'c3', author: 'Ola', text: 'Wygląda pysznie 😋' }] },
  { id: 'p3', title: 'Interwały 20 min', likes: 205, comments: [] },//komentarze w []
];

export const BlogSection: React.FC<{ availableHeight?: number }> = ({ availableHeight }) => {
  const { palette, theme } = useTheme();
  const styles = useMemo(() => makeBlogStyles(palette, theme), [palette, theme]);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Safe-area reserves (notch + bottom tab)
  const TAB_EST = Platform.OS === 'ios' ? 80 : 64;
  const topReserve = insets.top + 12;
  const bottomReserve = insets.bottom + TAB_EST + 18;

  // Slightly larger than original, but not full-screen
  const visibleHeight = availableHeight ?? height;
  const CARD_HEIGHT = Math.min(360, visibleHeight - 80); // ensure card fits page with room for actions
  const ITEM_SPACING = 16; // a bit more breathing room between posts
  const SNAP = CARD_HEIGHT + ITEM_SPACING; // kept for reference if you re-enable snap

  const [data] = useState(SAMPLE_POSTS);

  return (
    // Full-screen page for the blog feed inside the outer pager
    <View style={[styles.screen, { height: visibleHeight }]}>      
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          // Each item has fixed total height = CARD_HEIGHT. Add horizontal padding only.
          <View style={{ height: CARD_HEIGHT, paddingHorizontal: 16 }}>
            <PostCard post={item} height={CARD_HEIGHT} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        // Keep content clear of notch and tab bar
        contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: bottomReserve }}
        // Classic feed scroll (no snap) so bottoms aren't clipped
        // Allow this list to scroll within the outer FlatList pager
        nestedScrollEnabled
        // Spacing between cards
        ItemSeparatorComponent={() => <View style={{ height: ITEM_SPACING }} />}
        // No getItemLayout needed without snap; uncomment if you re-enable snap
     />
    </View>
  );
};

export default BlogSection;
