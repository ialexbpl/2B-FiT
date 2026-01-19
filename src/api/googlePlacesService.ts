/**
 * Google Places API service for searching nearby gyms.
 * Requires EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in .env
 */

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export interface GooglePlaceGym {
  place_id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  distance?: number; // in meters, calculated client-side
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  photo_reference?: string;
  types?: string[];
}

interface PlacesNearbySearchResponse {
  results: Array<{
    place_id: string;
    name: string;
    vicinity: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
    user_ratings_total?: number;
    opening_hours?: {
      open_now?: boolean;
    };
    photos?: Array<{
      photo_reference: string;
    }>;
    types?: string[];
  }>;
  status: string;
  error_message?: string;
  next_page_token?: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in meters.
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Get photo URL from photo reference.
 */
export function getPhotoUrl(
  photoReference: string,
  maxWidth: number = 400
): string {
  if (!GOOGLE_PLACES_API_KEY || !photoReference) return '';
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

/**
 * Search for nearby gyms using Google Places API.
 * 
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @param keyword - Optional search keyword (e.g., "CrossFit", "fitness")
 * @param radiusMeters - Search radius in meters (default: 5000 = 5km)
 * @returns Array of gyms sorted by distance
 */
export async function searchNearbyGyms(
  userLat: number,
  userLon: number,
  keyword?: string,
  radiusMeters: number = 5000
): Promise<GooglePlaceGym[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return [];
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userLat},${userLon}&radius=${radiusMeters}&type=gym&key=${GOOGLE_PLACES_API_KEY}`;

    if (keyword && keyword.trim()) {
      url += `&keyword=${encodeURIComponent(keyword.trim())}`;
    }

    const response = await fetch(url);
    const data: PlacesNearbySearchResponse = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return [];
    }

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Map and calculate distances
    const gyms: GooglePlaceGym[] = data.results.map((place) => ({
      place_id: place.place_id,
      name: place.name,
      address: place.vicinity,
      location: place.geometry.location,
      distance: calculateDistance(
        userLat,
        userLon,
        place.geometry.location.lat,
        place.geometry.location.lng
      ),
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      opening_hours: place.opening_hours,
      photo_reference: place.photos?.[0]?.photo_reference,
      types: place.types,
    }));

    // Sort by distance (nearest first)
    gyms.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return gyms;
  } catch (error) {
    console.error('Error fetching nearby gyms:', error);
    return [];
  }
}

/**
 * Get detailed information about a specific place.
 */
export async function getPlaceDetails(placeId: string): Promise<{
  formatted_phone_number?: string;
  website?: string;
  url?: string; // Google Maps URL
  formatted_address?: string;
  opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
} | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key not configured');
    return null;
  }

  try {
    const fields = 'formatted_phone_number,website,url,formatted_address,opening_hours';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places Details API error:', data.status);
      return null;
    }

    return data.result;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

