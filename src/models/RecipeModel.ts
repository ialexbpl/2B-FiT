export type MealTimeType = 'breakfast' | 'second_breakfast' | 'lunch' | 'midday_meal' | 'dinner' | 'snack';
export type FlavorType = 'savory' | 'sweet';

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sort_order?: number;
}

export interface Recipe {
  id: string;
  user_id: string;
  username?: string;
  name: string;
  image_url?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time_min: number;
  preparation_steps?: string;
  flavor_type: FlavorType;
  suitable_for: MealTimeType[];
  is_premium?: boolean;
  is_new?: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined data
  ingredients?: RecipeIngredient[];
}

export interface RecipeFormData {
  name: string;
  image_url?: string;
  prep_time_min: string;
  preparation_steps: string;
  flavor_type: FlavorType;
  suitable_for: MealTimeType[];
  ingredients: {
    name: string;
    amount: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  }[];
}

export const MEAL_TIME_OPTIONS: { id: MealTimeType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'second_breakfast', label: 'Second breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'midday_meal', label: 'Midday meal' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
];

export const MEAL_FILTER_OPTIONS: { id: MealTimeType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
];

