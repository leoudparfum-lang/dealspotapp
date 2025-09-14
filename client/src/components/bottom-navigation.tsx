import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Search, MapPin, Map, Ticket, User } from "lucide-react";
import { useLocation } from "wouter";

interface BottomNavigationProps {
  currentPage: string;
}

export default function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      path: "/",
    },
    {
      id: "search",
      label: "Zoeken",
      icon: Search,
      path: "/search",
    },
    {
      id: "nearby",
      label: "Lokaal",
      icon: MapPin,
      path: "/nearby",
    },
    {
      id: "netherlands",
      label: "Nederland",
      icon: Map,
      path: "/netherlands",
    },
    {
      id: "vouchers",
      label: "Vouchers",
      icon: Ticket,
      path: "/vouchers",
      badge: 3, // This would come from actual data
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 z-40 safe-area-bottom">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center space-y-1 p-2 relative ${
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setLocation(item.path)}
              data-testid={`nav-${item.id}`}
            >
              <IconComponent className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge && (
                <Badge 
                  variant="secondary"
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-secondary text-secondary-foreground"
                  data-testid={`badge-${item.id}`}
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
