import { supabase } from '../config/supabase'; // Import Supabase client
import { Gym } from '../models/GymModels';

/**
 * Fetches gyms, filtering by address or city.
 */
export const fetchGyms = async (query: string = ''): Promise<Gym[]> => {
  try {
    let queryBuilder = supabase
      .from('gyms')
      .select('id, name, address, city'); // Fetch only required fields

    if (query.trim()) {
      const searchTerms = query.toLowerCase().trim();
      // Search by address OR city containing the phrase (case-insensitive)
      queryBuilder = queryBuilder.or(
        `address.ilike.%${searchTerms}%,city.ilike.%${searchTerms}%`
      );
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Supabase error while fetching gyms:", error.message);
      return [];
    }

    return data as Gym[];
  } catch (err) {
    console.error("Unexpected error in fetchGyms:", err);
    return [];
  }
};

/**
 * Fetches details of a single gym by its ID.
 */
export const fetchGymDetails = async (id: string): Promise<Gym | undefined> => {
  try {
    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Supabase error while fetching gym details:", error.message);
      return undefined;
    }
    
    return data as Gym | undefined;

  } catch (err) {
    console.error("Unexpected error in fetchGymDetails:", err);
    return undefined;
  }
};