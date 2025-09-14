import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "@/hooks/useLocation";
import { MapPin, Navigation, Star, Clock, Maximize2, Minimize2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

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

interface DealsMapProps {
  deals: Deal[];
  userLocation?: { latitude: number; longitude: number } | null;
}

export default function DealsMap({ deals, userLocation }: DealsMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  
  // Filter deals that have GPS coordinates
  const dealsWithLocation = deals.filter(deal => 
    deal.business.latitude && deal.business.longitude
  );

  // Calculate center point
  const centerLat = userLocation?.latitude || 52.3676; // Amsterdam centrum als fallback
  const centerLng = userLocation?.longitude || 4.9041;

  // Create markers for Google Maps embed
  const createMapUrl = () => {
    const markers = dealsWithLocation.map((deal, index) => {
      const lat = parseFloat(deal.business.latitude!);
      const lng = parseFloat(deal.business.longitude!);
      return `markers=color:red%7Clabel:${index + 1}%7C${lat},${lng}`;
    }).join('&');
    
    const userMarker = userLocation ? 
      `&markers=color:blue%7Clabel:U%7C${userLocation.latitude},${userLocation.longitude}` : '';
    
    return `https://www.google.com/maps/embed/v1/view?key=AIzaSyA-placeholder&center=${centerLat},${centerLng}&zoom=13&${markers}${userMarker}`;
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
      {/* Map container */}
      <Card className={`overflow-hidden ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium">Deals op kaart ({dealsWithLocation.length})</span>
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
        
        <CardContent className={`p-0 ${isFullscreen ? 'flex-1' : ''}`}>
          {dealsWithLocation.length > 0 ? (
            <div className={`relative bg-gray-100 ${isFullscreen ? 'h-full' : 'h-64'}`}>
              {/* Fallback kaart weergave zonder external libs */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
                <div className="text-center p-6">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Kaartweergave</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {dealsWithLocation.length} deals beschikbaar op kaart
                  </p>
                  
                  {/* Deal markers als lijst */}
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {dealsWithLocation.slice(0, 3).map((deal, index) => (
                      <div 
                        key={deal.id}
                        className="flex items-center gap-2 text-xs bg-white rounded p-2 cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedDeal(deal)}
                        data-testid={`marker-${deal.id}`}
                      >
                        <Badge variant="secondary" className="w-5 h-5 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className="truncate">{deal.business.name}</span>
                      </div>
                    ))}
                    {dealsWithLocation.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{dealsWithLocation.length - 3} meer...
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* User location indicator */}
              {userLocation && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-blue-500 text-white">
                    <Navigation className="w-3 h-3 mr-1" />
                    Jouw locatie
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-center p-6">
              <div>
                <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Geen deals met locaties beschikbaar
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected deal popup */}
      {selectedDeal && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm">Geselecteerde deal</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDeal(null)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            
            <div className="flex gap-3">
              {selectedDeal.imageUrl && (
                <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                  <img
                    src={selectedDeal.imageUrl}
                    alt={selectedDeal.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-sm line-clamp-1 mb-1">
                  {selectedDeal.title}
                </h5>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                  {selectedDeal.business.name} • {selectedDeal.business.address}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">
                      {parseFloat(selectedDeal.business.rating).toFixed(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through">
                      €{parseFloat(selectedDeal.originalPrice).toFixed(2)}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      €{parseFloat(selectedDeal.discountedPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <Link href={`/deals/${selectedDeal.id}`}>
                  <Button size="sm" className="w-full mt-2" data-testid="button-view-deal">
                    Deal bekijken
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deal list below map */}
      {!isFullscreen && dealsWithLocation.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm px-4">Deals op kaart</h4>
          <div className="space-y-2 px-4">
            {dealsWithLocation.slice(0, 5).map((deal, index) => (
              <Link key={deal.id} href={`/deals/${deal.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm line-clamp-1">
                          {deal.title}
                        </h5>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {deal.business.name}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary">
                          €{parseFloat(deal.discountedPrice).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground line-through">
                          €{parseFloat(deal.originalPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}