import { supabase } from './supabase';

export type SleepEntry = {
    id?: string;
    user_id: string;
    date: string; // YYYY-MM-DD
    bedtime: string; // ISO timestamp
    wake_time: string; // ISO timestamp
    hours: number;
    created_at?: string;
    updated_at?: string;
};

/**
 * Fetch sleep entries for a user within a date range
 */
export async function fetchSleepEntries(
    userId: string,
    startDate: string,
    endDate: string
): Promise<SleepEntry[]> {
    const { data, error } = await supabase
        .from('sleep_log')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Fetch a single sleep entry for a specific date
 */
export async function fetchSleepEntry(
    userId: string,
    date: string
): Promise<SleepEntry | null> {
    const { data, error } = await supabase
        .from('sleep_log')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Upsert (create or update) a sleep entry
 */
export async function upsertSleepEntry(
    userId: string,
    entry: {
        date: string;
        bedtime: string;
        wake_time: string;
        hours: number;
    }
): Promise<SleepEntry> {
    const { data, error } = await supabase
        .from('sleep_log')
        .upsert(
            {
                user_id: userId,
                date: entry.date,
                bedtime: entry.bedtime,
                wake_time: entry.wake_time,
                hours: entry.hours,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,date' }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a sleep entry for a specific date
 */
export async function deleteSleepEntry(
    userId: string,
    date: string
): Promise<void> {
    const { error } = await supabase
        .from('sleep_log')
        .delete()
        .eq('user_id', userId)
        .eq('date', date);

    if (error) throw error;
}

