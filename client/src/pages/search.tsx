import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import CategoryTabs from "@/components/category-tabs";
import DealCard from "@/components/deal-card";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Filter, Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { useLocation } from "wouter";

interface Deal {
  id: string;
  title: string;
  description: string;
  originalPrice: string;
  discountedPrice: string;
  discountPercentage: number;
  imageUrl?: string;
  business: {
    name: string;
    address: string;
    city: string;
    rating: string;
    reviewCount: number;
  };
}

export default function Search() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState("Amsterdam");

  // Initialize search query from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    if (queryParam) {
      setSearchQuery(decodeURIComponent(queryParam));
    }
  }, [location]);

  // Get user location
  useEffect(() => {
    const getUserLocation = async () => {
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: false
            });
          });
          
          // Use Nominatim (OpenStreetMap) for reverse geocoding - free service
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || 'Amsterdam';
            setUserLocation(city);
          }
        } catch (error) {
          console.log("Location access denied or failed:", error);
          setUserLocation("Amsterdam"); // fallback
        }
      }
    };
    
    getUserLocation();
  }, []);

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["/api/deals", selectedCategory === "all" ? undefined : selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      
      const res = await fetch(`/api/deals?${params}`);
      return res.json() as Promise<Deal[]>;
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["/api/favorites"],
  });

  const favoriteIds = new Set(favorites.map((fav: any) => fav.id));

  const sortedDeals = [...deals].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.discountedPrice) - parseFloat(b.discountedPrice);
      case "price-high":
        return parseFloat(b.discountedPrice) - parseFloat(a.discountedPrice);
      case "discount":
        return b.discountPercentage - a.discountPercentage;
      case "rating":
        return parseFloat(b.business.rating) - parseFloat(a.business.rating);
      default: // newest
        return 0;
    }
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        location={userLocation}
        onSearch={handleSearch}
      />
      
      <CategoryTabs 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Search and Filter Bar */}
      <div className="px-4 py-4 bg-card border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek naar deals, restaurants, wellness..."
              className="pl-10"
              data-testid="input-search-deals"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Sorteren op
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="select-sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Nieuwste eerst</SelectItem>
                  <SelectItem value="price-low">Prijs: laag naar hoog</SelectItem>
                  <SelectItem value="price-high">Prijs: hoog naar laag</SelectItem>
                  <SelectItem value="discount">Hoogste korting</SelectItem>
                  <SelectItem value="rating">Beste beoordeling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <main className="pb-24">
        {/* Search Results */}
        <section className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground" data-testid="text-search-results">
              {searchQuery ? `Resultaten voor "${searchQuery}"` : "Alle deals"}
            </h2>
            <span className="text-sm text-muted-foreground" data-testid="text-results-count">
              {deals.length} resultaten
            </span>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedDeals.length > 0 ? (
            <div className="space-y-4">
              {sortedDeals.map((deal) => (
                <DealCard 
                  key={deal.id} 
                  deal={deal} 
                  isFavorite={favoriteIds.has(deal.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center" data-testid="card-no-search-results">
              <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Geen resultaten gevonden
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? `We konden geen deals vinden voor "${searchQuery}"`
                  : "Er zijn momenteel geen deals beschikbaar in deze categorie"
                }
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  data-testid="button-clear-search"
                >
                  Zoekterm wissen
                </Button>
              )}
            </Card>
          )}
        </section>
      </main>

      <BottomNavigation currentPage="search" />
      <div className="h-20"></div> {/* Space for fixed bottom navigation */}
    </div>
  );
}
