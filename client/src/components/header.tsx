import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, MapPin, User, Search, Percent, LogOut, Shield, Building, MessageCircle, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import LiveChat from "@/components/live-chat";
import NotificationCenter, { usePushNotifications } from "@/components/push-notifications";

interface HeaderProps {
  location?: string;
  notificationCount?: number;
  onSearch?: (query: string) => void;
}

export default function Header({ 
  location = "Amsterdam", 
  notificationCount = 0,
  onSearch 
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(location);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const { unreadCount } = usePushNotifications();
  const { isDemoMode } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search page with query
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // Navigate to search page without query
      setLocation('/search');
    }
  };

  const handleLogout = () => {
    if (isDemoMode) {
      localStorage.removeItem('demo-mode');
      window.location.reload();
    } else {
      window.location.href = '/api/logout';
    }
  };

  // Location detection functions
  const detectCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Locatie niet ondersteund",
        description: "Uw browser ondersteunt geen locatiedetectie.",
        variant: "destructive",
      });
      return;
    }

    setIsDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding to get city name
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=nl`
          );
          
          if (response.ok) {
            const data = await response.json();
            const city = data.city || data.locality || data.principalSubdivision || "Onbekende locatie";
            setCurrentLocation(city);
            
            toast({
              title: "Locatie gedetecteerd",
              description: `Uw locatie is ingesteld op ${city}`,
            });
          } else {
            throw new Error('Geocoding failed');
          }
        } catch (error) {
          console.error('Error getting location name:', error);
          setCurrentLocation(`${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`);
          
          toast({
            title: "Locatie gedetecteerd",
            description: "Coördinaten opgehaald",
          });
        }
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsDetectingLocation(false);
        
        let errorMessage = "Kon uw locatie niet ophalen.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Locatietoegang geweigerd. Schakel locatie in voor uw browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Locatie-informatie is niet beschikbaar.";
            break;
          case error.TIMEOUT:
            errorMessage = "Locatieaanvraag time-out.";
            break;
        }
        
        toast({
          title: "Locatie fout",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleLocationSelect = (selectedLocation: string) => {
    setCurrentLocation(selectedLocation);
    setShowLocationPicker(false);
    toast({
      title: "Locatie gewijzigd",
      description: `Locatie ingesteld op ${selectedLocation}`,
    });
  };

  const handleAdminLogin = () => {
    const username = prompt("Admin gebruikersnaam:");
    const password = prompt("Admin wachtwoord:");
    
    if (username && password) {
      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast({
            title: "Admin login succesvol!",
            description: `Welkom ${data.admin.name}`,
          });
          window.location.href = '/admin';
        } else {
          toast({
            title: "Login mislukt",
            description: "Controleer je credentials",
            variant: "destructive",
          });
        }
      })
      .catch(() => {
        toast({
          title: "Fout",
          description: "Er ging iets mis bij het inloggen",
          variant: "destructive",
        });
      });
    }
  };

  return (
    <header className="floating-nav sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Percent className="text-primary-foreground text-sm" />
            </div>
            <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">
              DealSpot
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Location - only on desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLocationPicker(true)}
              className="hidden md:flex items-center space-x-1 text-muted-foreground hover:text-foreground p-2 touch-target"
              data-testid="location-indicator"
              disabled={isDetectingLocation}
            >
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isDetectingLocation ? "Detecteren..." : currentLocation}
              </span>
            </Button>
            
            {/* Core actions - always visible */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowNotifications(true)}
              className="relative p-2 touch-target"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center text-xs text-secondary-foreground font-bold"
                  data-testid="notification-badge"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowChat(true)}
              className="p-2 touch-target"
              data-testid="button-live-chat"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>

            {/* Demo mode indicator - compact on mobile */}
            {isDemoMode && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                  Demo
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground"
                  data-testid="button-logout-demo"
                  title="Demo afsluiten"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 touch-target md:hidden"
              data-testid="button-mobile-menu"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Desktop only items */}
            <div className="hidden md:flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 touch-target"
                onClick={() => window.location.href = '/business/login'}
                data-testid="button-business-login"
                title="Business Login"
              >
                <Building className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 touch-target"
                onClick={handleAdminLogin}
                data-testid="button-admin-login"
                title="Admin Login"
              >
                <Shield className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="w-8 h-8 p-0 rounded-full bg-muted"
                data-testid="button-profile"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden mt-3 p-3 bg-muted/50 rounded-lg border border-border">
            <div className="flex flex-col space-y-3">
              {/* Location on mobile */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowLocationPicker(true);
                  setShowMobileMenu(false);
                }}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground p-2 justify-start"
                data-testid="location-indicator-mobile"
                disabled={isDetectingLocation}
              >
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isDetectingLocation ? "Detecteren..." : currentLocation}
                </span>
              </Button>
              
              {/* Mobile menu actions */}
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-2 p-2"
                  onClick={() => {
                    window.location.href = '/business/login';
                    setShowMobileMenu(false);
                  }}
                  data-testid="button-business-login-mobile"
                >
                  <Building className="h-4 w-4" />
                  <span className="text-sm">Business</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-2 p-2"
                  onClick={() => {
                    handleAdminLogin();
                    setShowMobileMenu(false);
                  }}
                  data-testid="button-admin-login-mobile"
                >
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Admin</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-2 p-2"
                  onClick={() => setShowMobileMenu(false)}
                  data-testid="button-profile-mobile"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">Profile</span>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-3 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Zoek naar deals, restaurants, wellness..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 bg-muted border-border focus:ring-2 focus:ring-ring focus:border-transparent"
              data-testid="input-search"
            />
          </div>
        </form>
      </div>

      <LiveChat 
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
      
      <NotificationCenter 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      
      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Kies uw locatie</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowLocationPicker(false)}
                className="p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <Button 
                variant="outline"
                onClick={detectCurrentLocation}
                disabled={isDetectingLocation}
                className="w-full justify-start"
                data-testid="button-detect-location"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isDetectingLocation ? "Detecteren..." : "Gebruik mijn huidige locatie"}
              </Button>
              
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted-foreground mb-2">Of kies een stad:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Amsterdam", "Rotterdam", "Den Haag", "Utrecht",
                    "Eindhoven", "Tilburg", "Groningen", "Almere",
                    "Breda", "Nijmegen", "Enschede", "Haarlem"
                  ].map((city) => (
                    <Button
                      key={city}
                      variant={currentLocation === city ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleLocationSelect(city)}
                      className="text-sm"
                      data-testid={`button-location-${city.toLowerCase()}`}
                    >
                      {city}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-border pt-3">
                <Input
                  type="text"
                  placeholder="Of typ een andere stad..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleLocationSelect(e.currentTarget.value.trim());
                      e.currentTarget.value = '';
                    }
                  }}
                  className="text-sm"
                  data-testid="input-custom-location"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Druk op Enter om de stad toe te voegen
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
