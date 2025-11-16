import { supabase } from '@utils/supabase';

export type ProfileSettingsRow = {
  id: string;
  sex: 'Male' | 'Female' | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal_weight_kg: number | null;
  activity_level: 'Low' | 'Moderate' | 'High' | 'Very High' | null;
  updated_at?: string | null;
};

export async function fetchProfileSettings(userId: string) {
  const { data, error } = await supabase
    .from('profile_settings')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileSettingsRow | null;
}

export async function upsertProfileSettings(
  userId: string,
  payload: Omit<ProfileSettingsRow, 'id' | 'updated_at'>
) {
  const { error } = await supabase
    .from('profile_settings')
    .upsert({ id: userId, ...payload }, { onConflict: 'id' });
  if (error) throw error;
}