// Location utilities for deals app

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPermission {
  granted: boolean;
  position?: Coordinates;
  error?: string;
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  pos1: Coordinates,
  pos2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(pos2.latitude - pos1.latitude);
  const dLon = deg2rad(pos2.longitude - pos1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(pos1.latitude)) *
      Math.cos(deg2rad(pos2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Get user's current location
export async function getCurrentLocation(): Promise<LocationPermission> {
  if (!navigator.geolocation) {
    return {
      granted: false,
      error: "Geolocatie wordt niet ondersteund door je browser"
    };
  }

  // Check if we're on HTTP - browsers block GPS on non-secure connections
  const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  if (!isSecure) {
    return {
      granted: false,
      error: "GPS werkt alleen op beveiligde verbindingen. Kies handmatig je stad hieronder."
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          granted: true,
          position: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        });
      },
      (error) => {
        let errorMessage = "Kon locatie niet ophalen";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "GPS toegang geweigerd. Kies je stad hieronder.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "GPS locatie niet beschikbaar. Kies je stad hieronder.";
            break;
          case error.TIMEOUT:
            errorMessage = "GPS duurde te lang. Kies je stad hieronder.";
            break;
        }
        
        resolve({
          granted: false,
          error: errorMessage
        });
      },
      {
        enableHighAccuracy: false, // Reduce power usage
        timeout: 8000, // Faster timeout
        maximumAge: 600000 // 10 minutes cache
      }
    );
  });
}

// Format distance for display
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance}km`;
}

// Dutch cities with coordinates for fallback
export const dutchCities = [
  { name: "Amsterdam", latitude: 52.3676, longitude: 4.9041 },
  { name: "Rotterdam", latitude: 51.9244, longitude: 4.4777 },
  { name: "Den Haag", latitude: 52.0705, longitude: 4.3007 },
  { name: "Utrecht", latitude: 52.0907, longitude: 5.1214 },
  { name: "Eindhoven", latitude: 51.4416, longitude: 5.4697 },
  { name: "Groningen", latitude: 53.2194, longitude: 6.5665 },
  { name: "Tilburg", latitude: 51.5556, longitude: 5.0914 },
  { name: "Almere", latitude: 52.3508, longitude: 5.2647 },
  { name: "Breda", latitude: 51.5719, longitude: 4.7683 },
  { name: "Nijmegen", latitude: 51.8426, longitude: 5.8518 }
];

// Get city by coordinates (approximate)
export function getCityByCoordinates(coordinates: Coordinates): string {
  let closestCity = dutchCities[0];
  let minDistance = calculateDistance(coordinates, closestCity);

  for (const city of dutchCities) {
    const distance = calculateDistance(coordinates, city);
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  }

  return closestCity.name;
}