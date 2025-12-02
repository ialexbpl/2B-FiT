import { supabase } from '../utils/supabase';

export type UserSearchResult = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export type UserProfileDetails = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  hashtags?: string | null;
  instagram?: string | null;
  facebook?: string | null;
};

/**
 * Looks up profiles by username or full name.
 * Returns at most 25 rows to keep the dashboard search snappy.
 */
export const searchUsers = async (
  query: string,
  excludeUserId?: string
): Promise<UserSearchResult[]> => {
  try {
    const normalized = query.trim();
    if (!normalized) return [];

    let builder = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .limit(25);

    if (excludeUserId) {
      builder = builder.neq('id', excludeUserId);
    }

    const fragment = `%${normalized}%`;
    builder = builder.or(`username.ilike.${fragment},full_name.ilike.${fragment}`);

    const { data, error } = await builder;
    if (error) {
      console.error('Supabase error while searching users:', error.message);
      return [];
    }

    return (data as UserSearchResult[]) ?? [];
  } catch (err) {
    console.error('Unexpected error while searching users:', err);
    return [];
  }
};

/**
 * Fetches full profile row (where available). Returns null on error.
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfileDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Supabase error while fetching user profile:', error.message);
      return null;
    }

    // These fields may not exist in the table; keep null to avoid runtime errors.
    const fallback: UserProfileDetails = {
      ...(data as any),
      bio: (data as any)?.bio ?? null,
      hashtags: (data as any)?.hashtags ?? null,
      instagram: (data as any)?.instagram ?? null,
      facebook: (data as any)?.facebook ?? null,
    };

    return fallback;
  } catch (err) {
    console.error('Unexpected error while fetching user profile:', err);
    return null;
  }
};
