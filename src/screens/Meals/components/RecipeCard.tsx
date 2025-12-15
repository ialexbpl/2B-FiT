import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@context/ThemeContext';
import type { Recipe } from '@models/RecipeModel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 16px padding on each side + 16px gap

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onQuickAdd?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function RecipeCard({ recipe, onPress, onQuickAdd, onFavorite, isFavorite }: RecipeCardProps) {
  const { palette } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {recipe.image_url ? (
          <Image source={{ uri: recipe.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: palette.card100 }]}>
            <Icon name="restaurant-outline" size={40} color={palette.subText} />
          </View>
        )}

        {/* Badges */}
        <View style={styles.badgesContainer}>
          {recipe.is_premium && (
            <View style={[styles.badge, styles.premiumBadge]}>
              <Icon name="star" size={10} color="#fff" />
              <Text style={styles.badgeText}>Premium</Text>
            </View>
          )}
          {recipe.is_new && (
            <View style={[styles.badge, styles.newBadge]}>
              <Text style={styles.badgeText}>New</Text>
            </View>
          )}
        </View>

        {/* Favorite Button */}
        {onFavorite && (
          <TouchableOpacity
            style={[styles.favoriteBtn, { backgroundColor: palette.card }]}
            onPress={onFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? '#ef4444' : palette.subText}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: palette.text }]} numberOfLines={2}>
          {recipe.name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: palette.subText }]}>Time</Text>
            <Text style={[styles.metaValue, { color: palette.text }]}>{recipe.prep_time_min} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: palette.subText }]}>Calories</Text>
            <Text style={[styles.metaValue, { color: palette.text }]}>{recipe.calories} kcal</Text>
          </View>
        </View>

        {/* Quick Add Button */}
        {onQuickAdd && (
          <TouchableOpacity
            style={[styles.quickAddBtn, { backgroundColor: palette.primary }]}
            onPress={(e) => {
              e.stopPropagation?.();
              onQuickAdd();
            }}
            activeOpacity={0.8}
          >
            <Icon name="add" size={16} color={palette.onPrimary} />
            <Text style={[styles.quickAddText, { color: palette.onPrimary }]}>Add to diary</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumBadge: {
    backgroundColor: '#8b5cf6',
  },
  newBadge: {
    backgroundColor: '#22c55e',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
