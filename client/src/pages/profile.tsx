import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Star, 
  Ticket, 
  Heart, 
  MapPin, 
  Settings, 
  Bell, 
  HelpCircle, 
  LogOut, 
  CreditCard,
  Gift,
  Calendar,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  loyaltyPoints: number;
}

interface UserStats {
  totalVouchers: number;
  activeVouchers: number;
  usedVouchers: number;
  totalSaved: number;
  favoriteDeals: number;
  totalReservations: number;
}

export default function Profile() {
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Niet ingelogd",
        description: "U moet ingelogd zijn om uw profiel te bekijken",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: vouchers = [] } = useQuery({
    queryKey: ["/api/vouchers"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["/api/reservations"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const stats: UserStats = {
    totalVouchers: vouchers.length,
    activeVouchers: vouchers.filter((v: any) => v.status === "active").length,
    usedVouchers: vouchers.filter((v: any) => v.status === "used").length,
    totalSaved: vouchers.reduce((total: number, voucher: any) => {
      if (voucher.deal && voucher.deal.originalPrice && voucher.deal.discountedPrice) {
        return total + (parseFloat(voucher.deal.originalPrice) - parseFloat(voucher.deal.discountedPrice));
      }
      return total;
    }, 0),
    favoriteDeals: favorites.length,
    totalReservations: reservations.length,
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Don't render if not authenticated and not loading
  if (!authLoading && !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header location="Amsterdam" />

      <main className="pb-24">
        {/* Profile Header */}
        <section className="px-4 py-6 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16" data-testid="avatar-profile">
                  <AvatarImage src={authUser?.profileImageUrl} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                    {getInitials(authUser?.firstName, authUser?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-foreground" data-testid="text-user-name">
                    {authUser?.firstName && authUser?.lastName 
                      ? `${authUser.firstName} ${authUser.lastName}`
                      : "Gebruiker"
                    }
                  </h1>
                  <p className="text-muted-foreground" data-testid="text-user-email">
                    {authUser?.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Star className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-medium text-foreground" data-testid="text-loyalty-points">
                      {authUser?.loyaltyPoints || 0} loyalty punten
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Stats */}
        <section className="px-4 py-6">
          <h2 className="text-lg font-semibold text-foreground mb-4" data-testid="text-statistics-title">
            Uw statistieken
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card data-testid="card-total-saved">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent mb-1">
                  €{stats.totalSaved.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Totaal bespaard</div>
              </CardContent>
            </Card>
            <Card data-testid="card-active-vouchers">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {stats.activeVouchers}
                </div>
                <div className="text-sm text-muted-foreground">Actieve vouchers</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <Card data-testid="card-total-vouchers">
              <CardContent className="p-3 text-center">
                <Ticket className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-lg font-semibold text-foreground">{stats.totalVouchers}</div>
                <div className="text-xs text-muted-foreground">Vouchers</div>
              </CardContent>
            </Card>
            <Card data-testid="card-favorites">
              <CardContent className="p-3 text-center">
                <Heart className="h-6 w-6 text-secondary mx-auto mb-2" />
                <div className="text-lg font-semibold text-foreground">{stats.favoriteDeals}</div>
                <div className="text-xs text-muted-foreground">Favorieten</div>
              </CardContent>
            </Card>
            <Card data-testid="card-reservations">
              <CardContent className="p-3 text-center">
                <Calendar className="h-6 w-6 text-accent mx-auto mb-2" />
                <div className="text-lg font-semibold text-foreground">{stats.totalReservations}</div>
                <div className="text-xs text-muted-foreground">Reserveringen</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Settings */}
        <section className="px-4 py-6">
          <h2 className="text-lg font-semibold text-foreground mb-4" data-testid="text-settings-title">
            Instellingen
          </h2>
          
          <Card>
            <CardContent className="p-0">
              {/* Notifications */}
              <div className="flex items-center justify-between p-4" data-testid="setting-notifications">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Notificaties</p>
                    <p className="text-sm text-muted-foreground">Ontvang updates over nieuwe deals</p>
                  </div>
                </div>
                <Switch 
                  checked={notifications} 
                  onCheckedChange={setNotifications}
                  data-testid="switch-notifications"
                />
              </div>
              
              <Separator />
              
              {/* Location Services */}
              <div className="flex items-center justify-between p-4" data-testid="setting-location">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Locatieservices</p>
                    <p className="text-sm text-muted-foreground">Voor deals in uw buurt</p>
                  </div>
                </div>
                <Switch 
                  checked={locationServices} 
                  onCheckedChange={setLocationServices}
                  data-testid="switch-location"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Menu Options */}
        <section className="px-4 py-6">
          <h2 className="text-lg font-semibold text-foreground mb-4" data-testid="text-menu-title">
            Menu
          </h2>
          
          <Card>
            <CardContent className="p-0">
              <button className="w-full flex items-center space-x-3 p-4 hover:bg-muted transition-colors" data-testid="button-payment-methods">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Betaalmethoden</span>
              </button>
              
              <Separator />
              
              <button className="w-full flex items-center space-x-3 p-4 hover:bg-muted transition-colors" data-testid="button-loyalty-program">
                <Gift className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Loyaliteitsprogramma</span>
              </button>
              
              <Separator />
              
              <button className="w-full flex items-center space-x-3 p-4 hover:bg-muted transition-colors" data-testid="button-help-support">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Help & Ondersteuning</span>
              </button>
              
              <Separator />
              
              <button 
                className="w-full flex items-center space-x-3 p-4 hover:bg-muted transition-colors text-destructive"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Uitloggen</span>
              </button>
            </CardContent>
          </Card>
        </section>

        {/* Loyalty Program Info */}
        <section className="px-4 py-6">
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Star className="h-8 w-8 text-secondary" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground" data-testid="text-loyalty-title">
                    Loyalty Programma
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Verdien punten bij elke aankoop
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Huidige punten:</span>
                  <span className="font-semibold text-foreground" data-testid="text-current-points">
                    {authUser?.loyaltyPoints || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tot volgende beloning:</span>
                  <span className="font-semibold text-primary" data-testid="text-points-to-reward">
                    {Math.max(0, 1000 - (authUser?.loyaltyPoints || 0))} punten
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <BottomNavigation currentPage="profile" />
      <div className="h-20"></div> {/* Space for fixed bottom navigation */}
    </div>
  );
}
