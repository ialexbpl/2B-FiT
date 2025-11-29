export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
    id: string;
    user_id?: string | null;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    created_at?: string;
    is_default?: boolean;
    vegetarian?: boolean;
    gluten_free?: boolean;
    lactose_free?: boolean;
}

export interface LogEntry {
    id: string;
    user_id: string;
    date: string; // YYYY-MM-DD
    meal_type: MealType;
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    created_at?: string;
}

export interface DailySummary {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}
