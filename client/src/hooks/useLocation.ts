import { useState, useEffect } from "react";
import { getCurrentLocation, type Coordinates, type LocationPermission } from "@/lib/location";

interface LocationState {
  location: Coordinates | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestLocation: () => Promise<void>;
}

export function useLocation(): LocationState {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const requestLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getCurrentLocation();
      
      if (result.granted && result.position) {
        setLocation(result.position);
        setHasPermission(true);
        // Store in localStorage for future use
        localStorage.setItem('user_location', JSON.stringify(result.position));
      } else {
        setError(result.error || "Kon locatie niet ophalen");
        setHasPermission(false);
      }
    } catch (err) {
      setError("Er ging iets mis bij het ophalen van je locatie");
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for stored location on mount
  useEffect(() => {
    const storedLocation = localStorage.getItem('user_location');
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        setLocation(parsed);
        setHasPermission(true);
      } catch {
        // Invalid stored location, ignore
      }
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    hasPermission,
    requestLocation
  };
}