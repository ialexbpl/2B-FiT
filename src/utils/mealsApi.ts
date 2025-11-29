import { supabase } from './supabase';
import type { FoodItem, LogEntry, MealType, DailySummary } from '../models/MealModel';
import { DEFAULT_FOODS } from '../constants/defaultFoods';

// --- User Foods (Custom Database) ---

export async function fetchUserFoods(userId: string): Promise<FoodItem[]> {
    const { data, error } = await supabase
        .from('user_foods')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
}

// Returns built-in foods (shared for all users) + user-specific ones.
export async function fetchAvailableFoods(userId: string): Promise<FoodItem[]> {
    const userFoods = await fetchUserFoods(userId);
    return [...DEFAULT_FOODS, ...userFoods];
}

export async function addUserFood(userId: string, food: Omit<FoodItem, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('user_foods')
        .insert([{ ...food, user_id: userId }])
        .select()
        .single();

    if (error) throw error;
    return data as FoodItem;
}

export async function deleteUserFood(foodId: string) {
    const { error } = await supabase
        .from('user_foods')
        .delete()
        .eq('id', foodId);

    if (error) throw error;
}

export async function updateUserFood(foodId: string, updates: Partial<Omit<FoodItem, 'id' | 'user_id' | 'created_at'>>) {
    const { data, error } = await supabase
        .from('user_foods')
        .update(updates)
        .eq('id', foodId)
        .select()
        .single();

    if (error) throw error;
    return data as FoodItem;
}

// --- Daily Log (Diary) ---

export async function fetchDailyLog(userId: string, date: string): Promise<LogEntry[]> {
    const { data, error } = await supabase
        .from('daily_log')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function addToLog(
    userId: string,
    date: string,
    mealType: MealType,
    food: { name: string; calories: number; protein: number; carbs: number; fat: number }
) {
    const { data, error } = await supabase
        .from('daily_log')
        .insert([
            {
                user_id: userId,
                date,
                meal_type: mealType,
                food_name: food.name,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data as LogEntry;
}

export async function deleteLogEntry(logId: string) {
    const { error } = await supabase
        .from('daily_log')
        .delete()
        .eq('id', logId);

    if (error) throw error;
}

export function calculateSummary(logs: LogEntry[]): DailySummary {
    return logs.reduce(
        (acc, item) => ({
            calories: acc.calories + (item.calories || 0),
            protein: acc.protein + (item.protein || 0),
            carbs: acc.carbs + (item.carbs || 0),
            fat: acc.fat + (item.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
}
