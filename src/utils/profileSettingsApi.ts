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
  allergies: string[] | null;
  is_private?: boolean | null;
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
  const { is_private, ...rest } = payload as any;
  const baseBody: any = { id: userId, ...rest };
  if (typeof is_private === 'boolean') {
    baseBody.is_private = is_private;
  }

  const { error } = await supabase
    .from('profile_settings')
    .upsert(baseBody, { onConflict: 'id' });

  // Fallback when column is missing in schema (older DB) — retry without is_private
  if (error?.message?.includes("is_private")) {
    const { error: retryError } = await supabase
      .from('profile_settings')
      .upsert({ id: userId, ...rest }, { onConflict: 'id' });
    if (retryError) throw retryError;
    return;
  }

  if (error) throw error;
}
