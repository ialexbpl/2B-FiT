import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { fetchRecipeById, toggleFavorite } from '@api/recipeService';
import type { Recipe } from '@models/RecipeModel';
import { AddToDiaryModal } from './components/AddToDiaryModal';

export default function RecipeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { palette } = useTheme();
  const { session } = useAuth();
  const recipeId = route.params?.recipeId;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [diaryModalVisible, setDiaryModalVisible] = useState(false);

  const loadRecipe = useCallback(async () => {
    if (!recipeId) return;
    setLoading(true);
    try {
      const data = await fetchRecipeById(recipeId);
      setRecipe(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load recipe.');
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  const handleToggleFavorite = async () => {
    if (!session?.user?.id || !recipe) return;
    try {
      const newState = await toggleFavorite(session.user.id, recipe.id);
      setIsFavorite(newState);
    } catch (e) {
      Alert.alert('Error', 'Failed to update favorite.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
        <Text style={[styles.errorText, { color: palette.subText }]}>Recipe not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: palette.card }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={22} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Recipe</Text>
          <TouchableOpacity
            style={[styles.favoriteBtn, { backgroundColor: palette.card }]}
            onPress={handleToggleFavorite}
          >
            <Icon
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#ef4444' : palette.text}
            />
          </TouchableOpacity>
        </View>

        {/* Image */}
        {recipe.image_url ? (
          <Image source={{ uri: recipe.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: palette.card100 }]}>
            <Icon name="restaurant-outline" size={60} color={palette.subText} />
          </View>
        )}

        {/* Recipe Info */}
        <View style={styles.content}>
          <Text style={[styles.recipeName, { color: palette.text }]}>{recipe.name}</Text>

          {/* Time & Calories Row */}
          <View style={[styles.infoRow, { borderColor: palette.border }]}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: palette.subText }]}>Time:</Text>
              <Text style={[styles.infoValue, { color: palette.text }]}>{recipe.prep_time_min} min</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: palette.subText }]}>Calories:</Text>
              <Text style={[styles.infoValue, { color: palette.text }]}>{recipe.calories} kcal</Text>
            </View>
          </View>

          {/* Macros Row */}
          <View style={[styles.macrosRow, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: palette.text }]}>{recipe.protein}g</Text>
              <Text style={[styles.macroLabel, { color: palette.subText }]}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: palette.text }]}>{recipe.fat}g</Text>
              <Text style={[styles.macroLabel, { color: palette.subText }]}>Fats</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: palette.text }]}>{recipe.carbs}g</Text>
              <Text style={[styles.macroLabel, { color: palette.subText }]}>Carbohydrates</Text>
            </View>
          </View>

          {/* Add to Diary Button */}
          <TouchableOpacity
            style={[styles.addToDiaryBtn, { backgroundColor: palette.primary }]}
            onPress={() => setDiaryModalVisible(true)}
          >
            <Text style={[styles.addToDiaryText, { color: palette.onPrimary }]}>Add to diary</Text>
          </TouchableOpacity>

          {/* Ingredients Section */}
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Ingredients</Text>
          <View style={[styles.ingredientsCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              <>
                {/* Group by category if needed - for now just "Cake" as shown in mockup */}
                <Text style={[styles.ingredientCategory, { color: palette.text }]}>Cake</Text>
                {recipe.ingredients.map((ingredient, index) => (
                  <View key={ingredient.id || index} style={styles.ingredientRow}>
                    <View style={styles.ingredientBullet}>
                      <View style={[styles.bullet, { backgroundColor: palette.primary }]} />
                    </View>
                    <Text style={[styles.ingredientName, { color: palette.text }]}>{ingredient.name}</Text>
                    <Text style={[styles.ingredientAmount, { color: palette.text }]}>{ingredient.amount}</Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={[styles.emptyText, { color: palette.subText }]}>No ingredients listed</Text>
            )}
          </View>

          {/* Preparation Section */}
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Preparation</Text>
          <View style={[styles.preparationCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            {recipe.preparation_steps ? (
              <Text style={[styles.preparationText, { color: palette.text }]}>
                {recipe.preparation_steps}
              </Text>
            ) : (
              <Text style={[styles.emptyText, { color: palette.subText }]}>No preparation steps</Text>
            )}
          </View>

          {/* Creator info */}
          {recipe.username && (
            <Text style={[styles.creatorText, { color: palette.subText }]}>
              Recipe by: {recipe.username}
            </Text>
          )}
        </View>
      </ScrollView>

      <AddToDiaryModal
        visible={diaryModalVisible}
        recipe={recipe}
        onClose={() => setDiaryModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  favoriteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    marginRight: 6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  macrosRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
  },
  addToDiaryBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  addToDiaryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  ingredientsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  ingredientCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ingredientBullet: {
    width: 24,
    alignItems: 'center',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ingredientName: {
    flex: 1,
    fontSize: 14,
  },
  ingredientAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  preparationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  preparationText: {
    fontSize: 14,
    lineHeight: 22,
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  creatorText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});

