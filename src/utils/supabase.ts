// Supabase client configured to use AsyncStorage for session persistence.
// This avoids SecureStore's 2KB value limit warnings.
// src/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase URL:', supabaseUrl);

// Connectivity check
(async () => {
  try {
    console.log('Checking Google connectivity...');
    const res = await fetch('https://www.google.com', { method: 'HEAD' });
    console.log('Google connectivity check:', res.status);
  } catch (e) {
    console.error('Google connectivity check failed:', e);
  }

  try {
    console.log('Checking Supabase connectivity...');
    const sbRes = await fetch(supabaseUrl, { method: 'GET' });
    console.log('Supabase connectivity check:', sbRes.status);
  } catch (e) {
    console.error('Supabase connectivity check failed:', e);
  }
})();

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
