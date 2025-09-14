import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { reverseGeocode } from "@/lib/geocoding";
import "leaflet/dist/leaflet.css";

// Custom marker icon
const createCustomIcon = (isConfirmed: boolean) => new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${isConfirmed ? '#22c55e' : '#f59e0b'}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="12" r="4" fill="white"/>
      <path d="M16 18 L12 26 L20 26 Z" fill="white"/>
    </svg>
  `)}`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface BusinessLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  city?: string;
  businessName?: string;
  isLocationConfirmed?: boolean;
  className?: string;
  onMapClick?: (lat: number, lng: number, address?: string, city?: string) => void;
}

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number, address?: string, city?: string) => void }) {
  useMapEvents({
    click: async (e) => {
      if (onMapClick) {
        const { lat, lng } = e.latlng;
        try {
          const result = await reverseGeocode(lat, lng);
          if (result) {
            onMapClick(lat, lng, result.address, result.city);
          } else {
            onMapClick(lat, lng);
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          onMapClick(lat, lng);
        }
      }
    },
  });
  return null;
}

export default function BusinessLocationMap({
  latitude,
  longitude,
  address,
  city,
  businessName = "Jouw bedrijf",
  isLocationConfirmed = false,
  className = "",
  onMapClick
}: BusinessLocationMapProps) {
  const [mapKey, setMapKey] = useState(0);
  
  // Default to center of Netherlands if no coordinates
  const defaultCenter: [number, number] = [52.1326, 5.2913];
  const zoom = latitude && longitude ? 15 : 7;
  
  const center: [number, number] = latitude && longitude 
    ? [latitude, longitude] 
    : defaultCenter;
  
  // Force re-render when coordinates change
  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, [latitude, longitude]);
  
  const hasValidLocation = latitude && longitude;
  
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Locatie op kaart</h3>
          </div>
          
          {hasValidLocation && (
            <Badge 
              variant={isLocationConfirmed ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              {isLocationConfirmed ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Bevestigd
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Voorlopig
                </>
              )}
            </Badge>
          )}
        </div>
        
        {/* Address display */}
        {(address || city) && (
          <div className="mb-3 p-2 bg-muted rounded text-sm">
            <p className="font-medium">{businessName}</p>
            <p className="text-muted-foreground">
              {address && `${address}, `}{city}
            </p>
          </div>
        )}
        
        {/* Map container */}
        <div className="relative rounded-lg overflow-hidden border" style={{ height: '300px' }}>
          <MapContainer
            key={mapKey}
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            data-testid="business-location-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
            
            {hasValidLocation && (
              <Marker 
                position={[latitude, longitude]} 
                icon={createCustomIcon(isLocationConfirmed)}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-medium">{businessName}</p>
                    {address && <p className="text-sm text-muted-foreground">{address}</p>}
                    <p className="text-sm text-muted-foreground">{city}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
          
          {/* Overlay when no location */}
          {!hasValidLocation && (
            <div className="absolute inset-0 bg-muted/80 flex items-center justify-center">
              <div className="text-center p-4">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Vul je adres en stad in om de locatie op de kaart te zien
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Location info */}
        {hasValidLocation && (
          <div className="mt-3 text-xs text-muted-foreground">
            <p>Coördinaten: {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
            <p className="mt-1">
              {isLocationConfirmed 
                ? "Deze locatie is bevestigd en zal op de kaart van klanten verschijnen."
                : "Deze locatie is automatisch bepaald. Controleer of deze correct is."
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}