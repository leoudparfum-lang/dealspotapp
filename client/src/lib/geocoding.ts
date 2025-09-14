// Geocoding service using OpenStreetMap Nominatim API
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export interface ReverseGeocodingResult {
  address?: string;
  city?: string;
  displayName: string;
}

export class GeocodingService {
  private static readonly BASE_URL = 'https://nominatim.openstreetmap.org/search';
  
  static async geocodeAddress(address: string, city: string, country: string = 'Netherlands'): Promise<GeocodingResult | null> {
    try {
      const fullAddress = `${address}, ${city}, ${country}`;
      const url = new URL(this.BASE_URL);
      
      url.searchParams.append('q', fullAddress);
      url.searchParams.append('format', 'json');
      url.searchParams.append('limit', '1');
      url.searchParams.append('countrycodes', 'nl'); // Limit to Netherlands
      url.searchParams.append('addressdetails', '1');
      
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'DealSpot-App/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          displayName: result.display_name
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
  
  // Backup method for Dutch cities with known coordinates
  static getKnownCityCoordinates(city: string): GeocodingResult | null {
    const knownCities: Record<string, GeocodingResult> = {
      'Amsterdam': { latitude: 52.3676, longitude: 4.9041, displayName: 'Amsterdam, Nederland' },
      'Rotterdam': { latitude: 51.9244, longitude: 4.4777, displayName: 'Rotterdam, Nederland' },
      'Den Haag': { latitude: 52.0705, longitude: 4.3007, displayName: 'Den Haag, Nederland' },
      'Utrecht': { latitude: 52.0907, longitude: 5.1214, displayName: 'Utrecht, Nederland' },
      'Eindhoven': { latitude: 51.4416, longitude: 5.4697, displayName: 'Eindhoven, Nederland' },
      'Groningen': { latitude: 53.2194, longitude: 6.5665, displayName: 'Groningen, Nederland' },
      'Maastricht': { latitude: 50.8514, longitude: 5.6913, displayName: 'Maastricht, Nederland' },
      'Breda': { latitude: 51.5719, longitude: 4.7683, displayName: 'Breda, Nederland' },
      'Nijmegen': { latitude: 51.8426, longitude: 5.8544, displayName: 'Nijmegen, Nederland' },
      'Haarlem': { latitude: 52.3874, longitude: 4.6462, displayName: 'Haarlem, Nederland' },
      'Zwolle': { latitude: 52.5168, longitude: 6.0830, displayName: 'Zwolle, Nederland' },
      'Apeldoorn': { latitude: 52.2112, longitude: 5.9699, displayName: 'Apeldoorn, Nederland' },
      'Amersfoort': { latitude: 52.1561, longitude: 5.3878, displayName: 'Amersfoort, Nederland' },
      'Dordrecht': { latitude: 51.8133, longitude: 4.6900, displayName: 'Dordrecht, Nederland' },
      'Naarden': { latitude: 52.2959, longitude: 5.1623, displayName: 'Naarden, Nederland' }
    };
    
    return knownCities[city] || null;
  }
}

// Reverse geocoding function
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    
    url.searchParams.append('lat', lat.toString());
    url.searchParams.append('lon', lng.toString());
    url.searchParams.append('format', 'json');
    url.searchParams.append('addressdetails', '1');
    url.searchParams.append('countrycodes', 'nl'); // Limit to Netherlands
    
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'DealSpot-App/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.address) {
      const address = data.address;
      
      // Extract relevant address components
      const street = address.road || address.pedestrian || '';
      const houseNumber = address.house_number || '';
      const fullAddress = street && houseNumber ? `${street} ${houseNumber}` : street;
      
      const city = address.city || 
                   address.town || 
                   address.village || 
                   address.municipality || 
                   address.county || '';
      
      return {
        address: fullAddress,
        city: city,
        displayName: data.display_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}