// Simple local cache for profile settings (offline/fast startup).
// We store only nutrition-relevant fields. Supabase is the source of truth; this is a warm-start helper.
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CachedProfileSettings = {
  sex: 'Male' | 'Female' | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal_weight_kg: number | null;
  activity_level: 'Low' | 'Moderate' | 'High' | 'Very High' | null;
  allergies: string[] | null;
};

const KEY = '@profile_settings_cache_v1';

export async function saveProfileSettingsCache(data: CachedProfileSettings) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to cache profile settings', e);
  }
}

export async function loadProfileSettingsCache(): Promise<CachedProfileSettings | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedProfileSettings;
  } catch (e) {
    console.warn('Failed to load cached profile settings', e);
    return null;
  }
}
