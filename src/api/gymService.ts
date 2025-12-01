import { supabase } from '../config/supabase'; // Zaimportuj klienta Supabase
import { Gym } from '../models/GymModels';

/**
 * Pobiera siłownie, filtrując po adresie lub mieście.
 */
export const fetchGyms = async (query: string = ''): Promise<Gym[]> => {
  try {
    let queryBuilder = supabase
      .from('gyms')
      .select('id, name, address, city'); // Pobieramy tylko potrzebne pola

    if (query.trim()) {
      const searchTerms = query.toLowerCase().trim();
      // Wyszukujemy adres LUB miasto zawierające frazę (case-insensitive)
      queryBuilder = queryBuilder.or(
        `address.ilike.%${searchTerms}%,city.ilike.%${searchTerms}%`
      );
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Błąd Supabase podczas pobierania siłowni:", error.message);
      return [];
    }

    return data as Gym[];
  } catch (err) {
    console.error("Nieoczekiwany błąd w fetchGyms:", err);
    return [];
  }
};

/**
 * Pobiera szczegóły pojedynczej siłowni na podstawie jej ID.
 */
export const fetchGymDetails = async (id: string): Promise<Gym | undefined> => {
  try {
    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Błąd Supabase podczas pobierania szczegółów:", error.message);
      return undefined;
    }
    
    return data as Gym | undefined;

  } catch (err) {
    console.error("Nieoczekiwany błąd w fetchGymDetails:", err);
    return undefined;
  }
};