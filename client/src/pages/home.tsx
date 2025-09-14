import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import CategoryTabs from "@/components/category-tabs";
import DealCard from "@/components/deal-card";
import BottomNavigation from "@/components/bottom-navigation";
import ChatWidget from "@/components/chat-widget";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Star, MapPin } from "lucide-react";
import { useState } from "react";

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

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
  business: {
    name: string;
  };
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<string>("Amsterdam");

  // Get user location
  useState(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd reverse geocode this to get city name
          // For now, we'll keep it as Amsterdam
        },
        (error) => {
          console.log("Location access denied");
        }
      );
    }
  });

  const { data: featuredDeals, isLoading: dealsLoading } = useQuery({
    queryKey: ["/api/deals", "featured"],
    queryFn: async () => {
      const res = await fetch("/api/deals/featured");
      return res.json() as Promise<Deal[]>;
    },
  });

  const { data: vouchers, isLoading: vouchersLoading } = useQuery({
    queryKey: ["/api/vouchers"],
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const { data: recentReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/reviews", "recent"],
    queryFn: async () => {
      // This would be implemented in the backend
      return [] as Review[];
    },
  });

  const unreadNotifications = notifications?.filter((n: any) => !n.isRead)?.length || 0;
  const activeVouchers = vouchers?.filter((v: any) => v.status === "active")?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        location={userLocation}
        notificationCount={unreadNotifications}
      />
      
      <CategoryTabs 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <main className="pb-24">
        {/* Featured Deals Section */}
        <section className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground" data-testid="text-featured-deals">
              Uitgelichte Deals
            </h2>
            <Button 
              variant="ghost" 
              className="text-primary font-medium text-sm"
              data-testid="button-view-all-deals"
            >
              Alles bekijken
            </Button>
          </div>
          
          {dealsLoading ? (
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
          ) : (
            <div className="space-y-4">
              {featuredDeals?.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
              {(!featuredDeals || featuredDeals.length === 0) && (
                <Card className="p-6 text-center" data-testid="card-no-deals">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Geen deals gevonden
                  </h3>
                  <p className="text-muted-foreground">
                    Er zijn momenteel geen uitgelichte deals beschikbaar in uw gebied.
                  </p>
                </Card>
              )}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="px-4 py-4 bg-muted/30">
          <h3 className="text-lg font-semibold text-foreground mb-4" data-testid="text-quick-actions">
            Snelle acties
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="card-vouchers">
              <CardContent className="p-4 text-center">
                <QrCode className="mx-auto h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">Mijn Vouchers</p>
                <p className="text-xs text-muted-foreground">
                  {vouchersLoading ? "..." : `${activeVouchers} actieve vouchers`}
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="card-loyalty-points">
              <CardContent className="p-4 text-center">
                <Star className="mx-auto h-8 w-8 text-secondary mb-2" />
                <p className="text-sm font-medium text-foreground">Loyalty Punten</p>
                <p className="text-xs text-muted-foreground">0 punten</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Reviews */}
        <section className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground" data-testid="text-recent-reviews">
              Recente beoordelingen
            </h2>
            <Button 
              variant="ghost"
              className="text-primary font-medium text-sm"
              data-testid="button-view-all-reviews"
            >
              Alle reviews
            </Button>
          </div>
          
          {reviewsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentReviews?.length === 0 && (
                <Card className="p-6 text-center" data-testid="card-no-reviews">
                  <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Geen recente reviews
                  </h3>
                  <p className="text-muted-foreground">
                    Er zijn nog geen recente beoordelingen om te tonen.
                  </p>
                </Card>
              )}
            </div>
          )}
        </section>
      </main>

      <BottomNavigation currentPage="home" />
      <div className="h-20"></div> {/* Space for fixed bottom navigation */}
      <ChatWidget />
    </div>
  );
}
