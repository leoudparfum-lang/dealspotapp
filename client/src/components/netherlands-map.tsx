import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Filter, Maximize2, Minimize2, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import "leaflet/dist/leaflet.css";

interface Business {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: string | null;
  longitude: string | null;
  imageUrl: string | null;
  rating: string;
  reviewCount: number;
}

interface Deal {
  id: string;
  title: string;
  description: string;
  originalPrice: string;
  discountedPrice: string;
  discountPercentage: number;
  imageUrl: string | null;
  business: Business;
}

// Custom marker icons for different states
const createCityMarker = (hasDeals: boolean, isSelected: boolean, dealCount: number) => {
  const color = isSelected ? '#0ea5e9' : hasDeals ? '#22c55e' : '#9ca3af';
  const iconSize = isSelected ? 36 : hasDeals ? 30 : 24;
  
  const svgContent = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/><text x="16" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${hasDeals ? dealCount : '•'}</text></svg>`;
  
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -(iconSize / 2)],
  });
};

// Nederlandse steden met hun coördinaten
const DUTCH_CITIES = [
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, deals: 0 },
  { name: 'Rotterdam', lat: 51.9244, lng: 4.4777, deals: 0 },
  { name: 'Den Haag', lat: 52.0705, lng: 4.3007, deals: 0 },
  { name: 'Utrecht', lat: 52.0907, lng: 5.1214, deals: 0 },
  { name: 'Eindhoven', lat: 51.4416, lng: 5.4697, deals: 0 },
  { name: 'Groningen', lat: 53.2194, lng: 6.5665, deals: 0 },
  { name: 'Maastricht', lat: 50.8514, lng: 5.6913, deals: 0 },
  { name: 'Breda', lat: 51.5719, lng: 4.7683, deals: 0 },
  { name: 'Nijmegen', lat: 51.8426, lng: 5.8544, deals: 0 },
  { name: 'Haarlem', lat: 52.3874, lng: 4.6462, deals: 0 },
  { name: 'Zwolle', lat: 52.5168, lng: 6.0830, deals: 0 },
  { name: 'Apeldoorn', lat: 52.2112, lng: 5.9699, deals: 0 },
  { name: 'Amersfoort', lat: 52.1561, lng: 5.3878, deals: 0 },
  { name: 'Dordrecht', lat: 51.8133, lng: 4.6900, deals: 0 },
  { name: 'Naarden', lat: 52.2959, lng: 5.1623, deals: 0 }
];

export default function NetherlandsMap() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [citiesWithDeals, setCitiesWithDeals] = useState(DUTCH_CITIES);

  // Fetch all deals
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
  });

  // Filter deals that have GPS coordinates - memoized to prevent infinite re-renders
  const dealsWithLocation = useMemo(() => 
    (deals as Deal[]).filter(deal => 
      deal.business.latitude && deal.business.longitude
    ), [deals]
  );

  // Group deals by city and update city deal counts
  useEffect(() => {
    if (dealsWithLocation.length === 0) {
      setCitiesWithDeals(DUTCH_CITIES);
      return;
    }

    const dealsByCity = dealsWithLocation.reduce((acc, deal) => {
      const city = deal.business.city;
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const updatedCities = DUTCH_CITIES.map(city => ({
      ...city,
      deals: dealsByCity[city.name] || 0
    }));

    setCitiesWithDeals(updatedCities);
  }, [dealsWithLocation.length]); // Use length instead of entire array to prevent unnecessary re-renders

  // Filter deals by selected city
  const filteredDeals = selectedCity 
    ? dealsWithLocation.filter(deal => deal.business.city === selectedCity)
    : dealsWithLocation;

  // Filter cities by search term
  const filteredCities = citiesWithDeals.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.deals > 0
  );

  const totalDeals = dealsWithLocation.length;
  const citiesWithActiveDeals = citiesWithDeals.filter(city => city.deals > 0).length;

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
      {/* Header with stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Nederland Overzicht</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              data-testid="button-toggle-fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{totalDeals}</div>
              <div className="text-xs text-muted-foreground">Totaal deals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{citiesWithActiveDeals}</div>
              <div className="text-xs text-muted-foreground">Actieve steden</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{filteredCities.length}</div>
              <div className="text-xs text-muted-foreground">Totaal steden</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Zoek stad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-city"
              />
            </div>
            <Button
              variant={selectedCity ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCity(null)}
              data-testid="button-show-all"
            >
              <Filter className="w-4 h-4 mr-1" />
              Alle
            </Button>
          </div>

          {selectedCity && (
            <div className="mb-3">
              <Badge variant="secondary" className="mr-2">
                Gefilterd op: {selectedCity}
              </Badge>
              <span className="text-sm text-muted-foreground">
                ({filteredDeals.length} deals)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Netherlands map visualization */}
      <Card className={`overflow-hidden ${isFullscreen ? 'flex-1' : ''}`}>
        <CardContent className={`p-0 ${isFullscreen ? 'h-full' : ''}`}>
          <div className={`relative ${isFullscreen ? 'h-full' : 'h-96'}`}>
            <MapContainer
              center={[52.1326, 5.2913]} // Center of Netherlands
              zoom={7}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
              data-testid="netherlands-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* City markers */}
              {filteredCities.map((city) => (
                <Marker
                  key={city.name}
                  position={[city.lat, city.lng]}
                  icon={createCityMarker(
                    city.deals > 0,
                    selectedCity === city.name,
                    city.deals
                  )}
                  eventHandlers={{
                    click: () => setSelectedCity(selectedCity === city.name ? null : city.name)
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <h4 className="font-semibold">{city.name}</h4>
                      {city.deals > 0 ? (
                        <p className="text-sm text-green-600 font-medium">
                          {city.deals} deal{city.deals > 1 ? 's' : ''} beschikbaar
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Geen deals beschikbaar
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* Deal markers - show individual deals if they have exact coordinates */}
              {dealsWithLocation.map((deal) => {
                const lat = parseFloat(deal.business.latitude!);
                const lng = parseFloat(deal.business.longitude!);
                
                return (
                  <Marker
                    key={deal.id}
                    position={[lat, lng]}
                    icon={new L.Icon({
                      iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="white" stroke-width="2"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">€</text></svg>')}`,
                      iconSize: [24, 24],
                      iconAnchor: [12, 12],
                      popupAnchor: [0, -12],
                    })}
                  >
                    <Popup>
                      <div className="min-w-48">
                        <h4 className="font-semibold">{deal.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{deal.business.name}</p>
                        <p className="text-sm text-gray-500 mb-2">{deal.business.city}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            €{parseFloat(deal.discountedPrice).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            €{parseFloat(deal.originalPrice).toFixed(2)}
                          </span>
                        </div>
                        <Link href={`/deals/${deal.id}`}>
                          <Button size="sm" className="w-full mt-2">
                            Bekijk Deal
                          </Button>
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
            
            {/* Map legend overlay */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
              <div className="text-xs font-medium mb-2">Legenda:</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>Steden met deals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  <span>Steden zonder deals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-sky-500 rounded-full"></div>
                  <span>Geselecteerde stad</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">€</div>
                  <span>Individuele deals</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals list for selected city or all */}
      {filteredDeals.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">
              {selectedCity ? `Deals in ${selectedCity}` : 'Alle deals'} ({filteredDeals.length})
            </h4>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredDeals.slice(0, 10).map((deal) => (
                <Link key={deal.id} href={`/deals/${deal.id}`}>
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    {/* Deal image */}
                    <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      {deal.imageUrl && (
                        <img
                          src={deal.imageUrl}
                          alt={deal.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    {/* Deal info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm line-clamp-1">
                        {deal.title}
                      </h5>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {deal.business.name} • {deal.business.city}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">
                          {parseFloat(deal.business.rating).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-primary">
                        €{parseFloat(deal.discountedPrice).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground line-through">
                        €{parseFloat(deal.originalPrice).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              
              {filteredDeals.length > 10 && (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">
                    +{filteredDeals.length - 10} meer deals...
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No deals message */}
      {!isLoading && filteredDeals.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              {selectedCity 
                ? `Geen deals gevonden in ${selectedCity}`
                : "Geen deals gevonden"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}