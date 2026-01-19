import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface UseLocationResult {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
  requestLocation: () => Promise<UserLocation | null>;
}

/**
 * Hook to get user's current location.
 * Handles permission requests and provides loading/error states.
 */
export function useLocation(autoRequest: boolean = false): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  const requestLocation = useCallback(async (): Promise<UserLocation | null> => {
    setLoading(true);
    setError(null);

    try {
      // Check current permission status
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      // Request permission if not granted
      if (existingStatus !== Location.PermissionStatus.GRANTED) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }
      
      setPermissionStatus(finalStatus);

      if (finalStatus !== Location.PermissionStatus.GRANTED) {
        setError('Brak uprawnień do lokalizacji. Włącz lokalizację w ustawieniach.');
        setLoading(false);
        return null;
      }

      // Get current position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLocation: UserLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(userLocation);
      setLoading(false);
      return userLocation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się pobrać lokalizacji';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, []);

  // Auto-request on mount if enabled
  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest, requestLocation]);

  return {
    location,
    loading,
    error,
    permissionStatus,
    requestLocation,
  };
}

