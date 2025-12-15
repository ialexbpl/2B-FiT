import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@context/ThemeContext';
import { fetchRecipes, searchRecipes } from '@api/recipeService';
import { RecipeCard } from './RecipeCard';
import { AddToDiaryModal } from './AddToDiaryModal';
import type { Recipe, MealTimeType } from '@models/RecipeModel';
import { MEAL_FILTER_OPTIONS } from '@models/RecipeModel';

export function FoodLibraryTab() {
  const navigation = useNavigation<any>();
  const { palette } = useTheme();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MealTimeType | 'all'>('all');
  
  // For quick-add to diary
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [diaryModalVisible, setDiaryModalVisible] = useState(false);

  const loadRecipes = useCallback(async () => {
    try {
      const data = await fetchRecipes(activeFilter);
      setRecipes(data);
    } catch (e) {
      console.error('Failed to load recipes:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 1) {
      try {
        const results = await searchRecipes(query.trim());
        setRecipes(results);
      } catch (e) {
        console.error('Search failed:', e);
      }
    } else if (query.trim().length === 0) {
      loadRecipes();
    }
  }, [loadRecipes]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchQuery('');
    loadRecipes();
  }, [loadRecipes]);

  const handleFilterChange = useCallback((filter: MealTimeType | 'all') => {
    setActiveFilter(filter);
    setSearchQuery('');
  }, []);

  const handleQuickAdd = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setDiaryModalVisible(true);
  }, []);

  const handleCloseDiaryModal = useCallback(() => {
    setDiaryModalVisible(false);
    setSelectedRecipe(null);
  }, []);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Icon name="search-outline" size={20} color={palette.subText} />
        <TextInput
          style={[styles.searchInput, { color: palette.text }]}
          placeholder="Search"
          placeholderTextColor={palette.subText}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Filter Pills */}
      <FlatList
        horizontal
        data={MEAL_FILTER_OPTIONS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterPill,
              { borderColor: palette.border },
              activeFilter === item.id && { backgroundColor: palette.primary, borderColor: palette.primary },
            ]}
            onPress={() => handleFilterChange(item.id)}
          >
            <Text
              style={[
                styles.filterText,
                { color: palette.text },
                activeFilter === item.id && { color: palette.onPrimary },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderRecipe = ({ item, index }: { item: Recipe; index: number }) => (
    <View style={[styles.cardWrapper, index % 2 === 0 ? { paddingRight: 8 } : { paddingLeft: 8 }]}>
      <RecipeCard
        recipe={item}
        onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
        onQuickAdd={() => handleQuickAdd(item)}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderRecipe}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="restaurant-outline" size={48} color={palette.subText} />
            <Text style={[styles.emptyText, { color: palette.subText }]}>
              No recipes found
            </Text>
            <Text style={[styles.emptySubtext, { color: palette.subText }]}>
              Be the first to add a recipe!
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={palette.primary}
          />
        }
      />

      {/* Add Recipe FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: palette.card, borderColor: palette.border }]}
        onPress={() => navigation.navigate('AddRecipe')}
      >
        <Icon name="add" size={28} color={palette.text} />
      </TouchableOpacity>

      {/* Add to Diary Modal */}
      <AddToDiaryModal
        visible={diaryModalVisible}
        recipe={selectedRecipe}
        onClose={handleCloseDiaryModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  filterContainer: {
    paddingRight: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cardWrapper: {
    width: '50%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    top: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
