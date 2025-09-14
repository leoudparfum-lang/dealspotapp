import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import DealCard from "@/components/deal-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Filter, ArrowUpDown } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

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

export default function Favorites() {
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Niet ingelogd",
        description: "U moet ingelogd zijn om uw favorieten te bekijken",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const sortedFavorites = [...favorites].sort((a: Deal, b: Deal) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.discountedPrice) - parseFloat(b.discountedPrice);
      case "price-high":
        return parseFloat(b.discountedPrice) - parseFloat(a.discountedPrice);
      case "discount":
        return b.discountPercentage - a.discountPercentage;
      case "rating":
        return parseFloat(b.business.rating) - parseFloat(a.business.rating);
      case "name":
        return a.title.localeCompare(b.title, "nl");
      default: // newest
        return 0;
    }
  });

  // Don't render if not authenticated and not loading
  if (!authLoading && !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header location="Amsterdam" />

      {/* Header with filters */}
      <div className="px-4 py-4 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-favorites-title">
            Mijn Favorieten
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Sorteren op
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="select-sort-favorites">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Laatst toegevoegd</SelectItem>
                  <SelectItem value="name">Naam (A-Z)</SelectItem>
                  <SelectItem value="price-low">Prijs: laag naar hoog</SelectItem>
                  <SelectItem value="price-high">Prijs: hoog naar laag</SelectItem>
                  <SelectItem value="discount">Hoogste korting</SelectItem>
                  <SelectItem value="rating">Beste beoordeling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Totaal opgeslagen deals:</span>
            <span className="font-semibold text-foreground" data-testid="text-favorites-count">
              {favorites.length}
            </span>
          </div>
          {favorites.length > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Totale besparing mogelijk:</span>
              <span className="font-semibold text-accent" data-testid="text-total-savings">
                €{favorites.reduce((total: number, deal: Deal) => {
                  return total + (parseFloat(deal.originalPrice) - parseFloat(deal.discountedPrice));
                }, 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      <main className="pb-24">
        <section className="px-4 py-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
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
          ) : sortedFavorites.length > 0 ? (
            <div className="space-y-4">
              {sortedFavorites.map((deal: Deal) => (
                <DealCard 
                  key={deal.id} 
                  deal={deal} 
                  isFavorite={true}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center" data-testid="card-no-favorites">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nog geen favorieten
              </h3>
              <p className="text-muted-foreground mb-6">
                Ontdek geweldige deals en voeg ze toe aan uw favorieten door op het hartje te klikken!
              </p>
              <Button
                onClick={() => window.location.href = "/"}
                data-testid="button-browse-deals"
              >
                Browse Deals
              </Button>
            </Card>
          )}
        </section>
      </main>

      <BottomNavigation currentPage="favorites" />
      <div className="h-20"></div> {/* Space for fixed bottom navigation */}
    </div>
  );
}
