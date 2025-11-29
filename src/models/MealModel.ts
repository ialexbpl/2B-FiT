export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
    id: string;
    user_id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    created_at?: string;
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
