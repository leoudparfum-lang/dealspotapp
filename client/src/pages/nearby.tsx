import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/hooks/useLocation";
import { useQuery } from "@tanstack/react-query";
import NearbyDeals from "@/components/nearby-deals";
import DealsMap from "@/components/deals-map";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { List, Map, MapPin } from "lucide-react";

export default function NearbyPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { location } = useLocation();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Fetch deals for both list and map views
  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
  });

  // Auto-redirect handled by App.tsx routing

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Locatie laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20">
        <div className="max-w-md mx-auto">
          {/* View mode toggle */}
          <div className="sticky top-16 z-10 bg-background border-b border-border p-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium flex-1">In de buurt</span>
              
              <div className="flex rounded-lg border border-border overflow-hidden">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3 py-1 h-8 rounded-none"
                  onClick={() => setViewMode('list')}
                  data-testid="button-view-list"
                >
                  <List className="w-4 h-4 mr-1" />
                  Lijst
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  className="px-3 py-1 h-8 rounded-none"
                  onClick={() => setViewMode('map')}
                  data-testid="button-view-map"
                >
                  <Map className="w-4 h-4 mr-1" />
                  Kaart
                </Button>
              </div>
            </div>
          </div>

          {/* Content based on view mode */}
          {viewMode === 'list' ? (
            <NearbyDeals />
          ) : (
            <div className="p-4">
              <DealsMap deals={deals} userLocation={location} />
            </div>
          )}
        </div>
      </main>

      <BottomNavigation currentPage="nearby" />
    </div>
  );
}