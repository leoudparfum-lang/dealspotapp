import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/hooks/useLocation";
import { calculateDistance, formatDistance, getCityByCoordinates, dutchCities } from "@/lib/location";
import { MapPin, Navigation, Star, Clock } from "lucide-react";
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

interface DealWithDistance extends Deal {
  distance: number | null;
}

export default function NearbyDeals() {
  const { location, isLoading: locationLoading, requestLocation, hasPermission, error } = useLocation();
  const { toast } = useToast();
  const [maxDistance, setMaxDistance] = useState(10); // 10km default

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
  });

  // Calculate distances and filter nearby deals
  const nearbyDeals = (deals as Deal[])
    .map((deal: Deal) => {
      if (!location || !deal.business.latitude || !deal.business.longitude) {
        return { ...deal, distance: null };
      }

      const businessLocation = {
        latitude: parseFloat(deal.business.latitude),
        longitude: parseFloat(deal.business.longitude)
      };

      const distance = calculateDistance(location, businessLocation);
      return { ...deal, distance };
    })
    .filter((deal: Deal & { distance: number | null }) => 
      deal.distance === null || deal.distance <= maxDistance
    )
    .sort((a: Deal & { distance: number | null }, b: Deal & { distance: number | null }) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

  const handleLocationRequest = async () => {
    console.log("🚀 Locatie aanvragen gestart...");
    await requestLocation();
    if (location) {
      console.log("✅ Locatie verkregen:", location);
      const city = getCityByCoordinates(location);
      toast({
        title: "Locatie gevonden!",
        description: `We tonen nu deals bij jou in de buurt van ${city}`,
      });
    } else {
      console.log("❌ Geen locatie verkregen:", error);
      // Don't show error toast - user can see the error in the UI
    }
  };

  if (!hasPermission) {
    return (
      <Card className="mx-4 my-6">
        <CardContent className="p-6 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Deals in de buurt</h3>
          
          {/* Show error message if available */}
          {error && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          )}
          
          <p className="text-muted-foreground mb-4">
            Vind de beste deals bij jou in de buurt! {!error && "Geef toegang tot je locatie voor gepersonaliseerde aanbevelingen."}
          </p>
          
          <div className="space-y-3">
            {/* Only show GPS button if no error or if error isn't about HTTP */}
            {(!error || !error.includes("beveiligde verbindingen")) && (
              <Button 
                onClick={handleLocationRequest} 
                disabled={locationLoading}
                className="w-full"
                data-testid="button-enable-location"
              >
                <Navigation className="w-4 h-4 mr-2" />
                {locationLoading ? "Locatie ophalen..." : "GPS Locatie gebruiken"}
              </Button>
            )}
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                {error ? "Kies je stad:" : "Of kies handmatig je stad:"}
              </p>
              <select 
                className="px-3 py-2 border rounded-md text-sm w-full"
                onChange={(e) => {
                  if (e.target.value) {
                    const city = dutchCities.find((c: any) => c.name === e.target.value);
                    if (city) {
                      localStorage.setItem('user_location', JSON.stringify({ latitude: city.latitude, longitude: city.longitude }));
                      toast({
                        title: "Locatie ingesteld!",
                        description: `Toon deals bij ${city.name}. Herlaad de pagina om te activeren.`,
                      });
                      setTimeout(() => window.location.reload(), 1500);
                    }
                  }
                }}
                defaultValue=""
              >
                <option value="">Kies je stad...</option>
                {dutchCities.map((city: any) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Location status and distance filter */}
      <div className="px-4 py-4 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {location ? getCityByCoordinates(location) : "Onbekende locatie"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLocationRequest}
            disabled={locationLoading}
            data-testid="button-refresh-location"
          >
            <Navigation className="w-3 h-3 mr-1" />
            Vernieuwen
          </Button>
        </div>
        
        {/* Distance filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Afstand:</span>
          <div className="flex gap-1">
            {[5, 10, 25, 50].map((distance) => (
              <Button
                key={distance}
                variant={maxDistance === distance ? "default" : "outline"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setMaxDistance(distance)}
                data-testid={`button-distance-${distance}`}
              >
                {distance}km
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Nearby deals list */}
      <div className="px-4">
        <h3 className="text-lg font-semibold mb-4">
          In de buurt ({nearbyDeals.length} deals)
        </h3>
        
        {dealsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : nearbyDeals.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                Geen deals gevonden binnen {maxDistance}km van je locatie.
                Probeer een grotere afstand.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {nearbyDeals.map((deal: DealWithDistance) => (
              <Link key={deal.id} href={`/deals/${deal.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-0">
                    <div className="relative">
                      {/* Deal image - Much larger now */}
                      <div className="w-full h-48 bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                        {deal.imageUrl ? (
                          <img
                            src={deal.imageUrl}
                            alt={deal.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                                <MapPin className="w-8 h-8 text-primary/60" />
                              </div>
                              <p className="text-sm text-muted-foreground font-medium">{deal.business.name}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Distance badge overlay */}
                        {deal.distance && (
                          <Badge className="absolute top-3 right-3 bg-white/90 backdrop-blur text-foreground shadow-lg">
                            {formatDistance(deal.distance)}
                          </Badge>
                        )}
                        
                        {/* Discount percentage overlay */}
                        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground shadow-lg">
                          -{deal.discountPercentage}% korting
                        </Badge>
                      </div>
                      
                      {/* Deal info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-lg line-clamp-2 pr-2">
                            {deal.title}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {deal.business.name} • {deal.business.address}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {parseFloat(deal.business.rating).toFixed(1)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({deal.business.reviewCount} reviews)
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-foreground">
                              €{parseFloat(deal.discountedPrice).toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              €{parseFloat(deal.originalPrice).toFixed(2)}
                            </span>
                          </div>
                          
                          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                            {Math.round(((parseFloat(deal.originalPrice) - parseFloat(deal.discountedPrice)) / parseFloat(deal.originalPrice)) * 100)}% besparing
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}