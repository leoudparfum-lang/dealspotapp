import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, Star, MapPin } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import ReservationModal from "./reservation-modal";
import PaymentModal from "./payment-modal";

interface Deal {
  id: string;
  title: string;
  description: string;
  originalPrice: string;
  discountedPrice: string;
  discountPercentage: number;
  imageUrl?: string;
  imageUrls?: string[];
  businessId: string;
  business: {
    name: string;
    address: string;
    city: string;
    rating: string;
    reviewCount: number;
  };
}

interface DealCardProps {
  deal: Deal;
  isFavorite?: boolean;
}

export default function DealCard({ deal, isFavorite = false }: DealCardProps) {
  const [isLiked, setIsLiked] = useState(isFavorite);
  const [showReservation, setShowReservation] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        return apiRequest("DELETE", `/api/favorites/${deal.id}`, {});
      } else {
        return apiRequest("POST", "/api/favorites", { dealId: deal.id });
      }
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: isLiked ? "Verwijderd uit favorieten" : "Toegevoegd aan favorieten",
        description: isLiked 
          ? "Deal is verwijderd uit uw favorieten" 
          : "Deal is toegevoegd aan uw favorieten",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Niet ingelogd",
          description: "U moet ingelogd zijn om favorieten te beheren",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van favorieten",
        variant: "destructive",
      });
    },
  });

  const handleFavoriteClick = () => {
    favoriteMutation.mutate();
  };

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3 h-3 ${
            i <= numRating 
              ? "fill-accent text-accent" 
              : "text-muted-foreground"
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <>
      <Card className="deal-card mobile-card swipeable overflow-hidden touch-target" data-testid={`card-deal-${deal.id}`}>
        <div className="relative w-full h-48 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
          {(deal.imageUrl || (deal.imageUrls && deal.imageUrls.length > 0)) ? (
            <img 
              src={deal.imageUrl || (deal.imageUrls && deal.imageUrls[0])} 
              alt={deal.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
          
          {/* Discount badge overlay */}
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground shadow-lg">
            -{deal.discountPercentage}% korting
          </Badge>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground line-clamp-2" data-testid={`text-deal-title-${deal.id}`}>
                {deal.title}
              </h3>
              <div className="flex items-center space-x-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span data-testid={`text-business-info-${deal.id}`}>
                  {deal.business.name} • {deal.business.city}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted rounded-full ml-2"
              onClick={handleFavoriteClick}
              disabled={favoriteMutation.isPending}
              data-testid={`button-favorite-${deal.id}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex items-center">
              <span className="text-accent font-bold text-lg" data-testid={`text-rating-${deal.id}`}>
                {deal.business.rating}
              </span>
              <div className="flex ml-1">
                {renderStars(deal.business.rating)}
              </div>
              <span className="text-muted-foreground text-sm ml-1" data-testid={`text-review-count-${deal.id}`}>
                ({deal.business.reviewCount})
              </span>
            </div>
          </div>
          
          {/* Price Section */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl font-bold text-foreground" data-testid={`text-discounted-price-${deal.id}`}>
              €{deal.discountedPrice}
            </span>
            <span className="text-muted-foreground line-through" data-testid={`text-original-price-${deal.id}`}>
              €{deal.originalPrice}
            </span>
            <Badge variant="secondary" className="bg-accent text-accent-foreground" data-testid={`badge-discount-${deal.id}`}>
              {deal.discountPercentage}% off
            </Badge>
          </div>
          
          {/* Action Buttons - Full Width */}
          <div className="flex space-x-2 w-full">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setShowReservation(true)}
              data-testid={`button-reserve-${deal.id}`}
            >
              <Calendar className="w-3 h-3 mr-1" />
              Reserveer
            </Button>
            <Button 
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setShowPayment(true)}
              data-testid={`button-buy-${deal.id}`}
            >
              Kopen
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReservationModal 
        isOpen={showReservation}
        onClose={() => setShowReservation(false)}
        deal={deal}
      />

      <PaymentModal 
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        deal={deal}
      />
    </>
  );
}
