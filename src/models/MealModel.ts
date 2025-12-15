export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

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
    recipe_id?: string;
    created_at?: string;
}

export interface DailySummary {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}
