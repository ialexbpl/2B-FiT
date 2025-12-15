import { supabase } from '@utils/supabase';
import type { Recipe, RecipeIngredient, MealTimeType } from '@models/RecipeModel';

// Fetch all recipes with optional meal type filter
export async function fetchRecipes(mealTypeFilter?: MealTimeType | 'all'): Promise<Recipe[]> {
  let query = supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });

  if (mealTypeFilter && mealTypeFilter !== 'all') {
    query = query.contains('suitable_for', [mealTypeFilter]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Fetch single recipe with ingredients
export async function fetchRecipeById(recipeId: string): Promise<Recipe | null> {
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single();

  if (recipeError) throw recipeError;
  if (!recipe) return null;

  const { data: ingredients, error: ingredientsError } = await supabase
    .from('recipe_ingredients')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('sort_order', { ascending: true });

  if (ingredientsError) throw ingredientsError;

  return {
    ...recipe,
    ingredients: ingredients || [],
  };
}

// Create a new recipe with ingredients
export async function createRecipe(
  userId: string,
  username: string,
  recipeData: {
    name: string;
    image_url?: string;
    prep_time_min: number;
    preparation_steps?: string;
    flavor_type: 'savory' | 'sweet';
    suitable_for: MealTimeType[];
    ingredients: {
      name: string;
      amount: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    }[];
  }
): Promise<Recipe> {
  // Calculate total nutrition from ingredients
  const totalCalories = recipeData.ingredients.reduce((sum, i) => sum + (i.calories || 0), 0);
  const totalProtein = recipeData.ingredients.reduce((sum, i) => sum + (i.protein || 0), 0);
  const totalCarbs = recipeData.ingredients.reduce((sum, i) => sum + (i.carbs || 0), 0);
  const totalFat = recipeData.ingredients.reduce((sum, i) => sum + (i.fat || 0), 0);

  // Insert recipe
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
      username,
      name: recipeData.name,
      image_url: recipeData.image_url,
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      prep_time_min: recipeData.prep_time_min,
      preparation_steps: recipeData.preparation_steps,
      flavor_type: recipeData.flavor_type,
      suitable_for: recipeData.suitable_for,
      is_new: true,
    })
    .select()
    .single();

  if (recipeError) throw recipeError;

  // Insert ingredients
  if (recipeData.ingredients.length > 0) {
    const ingredientsToInsert = recipeData.ingredients.map((ing, index) => ({
      recipe_id: recipe.id,
      name: ing.name,
      amount: ing.amount,
      calories: ing.calories || 0,
      protein: ing.protein || 0,
      carbs: ing.carbs || 0,
      fat: ing.fat || 0,
      sort_order: index,
    }));

    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientsToInsert);

    if (ingredientsError) throw ingredientsError;
  }

  return recipe;
}

// Delete a recipe
export async function deleteRecipe(recipeId: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId);

  if (error) throw error;
}

// Add recipe to daily log
export async function addRecipeToLog(
  userId: string,
  date: string,
  mealType: MealTimeType,
  recipe: Recipe
): Promise<void> {
  const { error } = await supabase
    .from('daily_log')
    .insert({
      user_id: userId,
      date,
      meal_type: mealType,
      recipe_id: recipe.id,
      food_name: recipe.name,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
    });

  if (error) throw error;
}

// Upload recipe image
export async function uploadRecipeImage(
  userId: string,
  imageUri: string
): Promise<string> {
  const response = await fetch(imageUri);
  const arrayBuffer = await response.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);
  
  const extension = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filePath = `${userId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('recipe-images')
    .upload(filePath, fileBytes, {
      upsert: true,
      contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
    });

  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(filePath);

  return publicData?.publicUrl ?? '';
}

// Search recipes by name
export async function searchRecipes(query: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

// Toggle favorite recipe
export async function toggleFavorite(userId: string, recipeId: string): Promise<boolean> {
  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorite_recipes')
    .select('id')
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)
    .single();

  if (existing) {
    // Remove favorite
    await supabase
      .from('favorite_recipes')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId);
    return false;
  } else {
    // Add favorite
    await supabase
      .from('favorite_recipes')
      .insert({ user_id: userId, recipe_id: recipeId });
    return true;
  }
}

// Fetch user's favorite recipes
export async function fetchFavoriteRecipes(userId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('favorite_recipes')
    .select('recipe_id, recipes(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data?.map((d: any) => d.recipes).filter(Boolean) || [];
}

