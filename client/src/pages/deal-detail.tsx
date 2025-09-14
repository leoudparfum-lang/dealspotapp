import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import ReservationModal from "@/components/reservation-modal";
import PaymentModal from "@/components/payment-modal";
import ReviewModal from "@/components/review-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Heart, 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Calendar, 
  Clock,
  Users,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface Deal {
  id: string;
  title: string;
  description: string;
  originalPrice: string;
  discountedPrice: string;
  discountPercentage: number;
  imageUrl?: string;
  expiresAt?: string;
  business: {
    id: string;
    name: string;
    description?: string;
    address: string;
    city: string;
    phone?: string;
    website?: string;
    rating: string;
    reviewCount: number;
  };
  category: {
    nameNl: string;
    icon: string;
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
}

export default function DealDetail() {
  const [, params] = useRoute("/deals/:id");
  const [, setLocation] = useLocation();
  const [showReservation, setShowReservation] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const dealId = params?.id;

  const { data: deal, isLoading: dealLoading, error } = useQuery({
    queryKey: ["/api/deals", dealId],
    queryFn: async () => {
      const res = await fetch(`/api/deals/${dealId}`);
      if (!res.ok) {
        throw new Error("Deal not found");
      }
      return res.json() as Promise<Deal>;
    },
    enabled: !!dealId,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/deals", dealId, "reviews"],
    enabled: !!dealId,
  });

  const { data: isFavoriteData } = useQuery({
    queryKey: ["/api/favorites", dealId, "check"],
    queryFn: async () => {
      const res = await fetch(`/api/favorites/${dealId}/check`, { credentials: 'include' });
      return res.json();
    },
    enabled: !!dealId,
  });

  // Update isLiked when favorite data changes
  useEffect(() => {
    if (isFavoriteData?.isFavorite !== undefined) {
      setIsLiked(isFavoriteData.isFavorite);
    }
  }, [isFavoriteData]);

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        return apiRequest(`/api/favorites/${dealId}`, { method: "DELETE" });
      } else {
        return apiRequest("/api/favorites", { method: "POST", body: { dealId } });
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

  const handleShare = async () => {
    if (navigator.share && deal) {
      try {
        await navigator.share({
          title: deal.title,
          text: `Bekijk deze geweldige deal: ${deal.title} voor slechts €${deal.discountedPrice}!`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled the share
      }
    } else if (deal) {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link gekopieerd",
          description: "De deal link is gekopieerd naar het klembord",
        });
      } catch (error) {
        toast({
          title: "Fout",
          description: "Kon de link niet kopiëren",
          variant: "destructive",
        });
      }
    }
  };

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= numRating 
              ? "fill-accent text-accent" 
              : "text-muted-foreground"
          }`}
        />
      );
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header location="Amsterdam" />
        <main className="px-4 py-8">
          <Card className="p-8 text-center" data-testid="card-deal-not-found">
            <h1 className="text-xl font-bold text-foreground mb-2">Deal niet gevonden</h1>
            <p className="text-muted-foreground mb-4">
              Deze deal bestaat niet of is niet meer beschikbaar.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-back-home">
              Terug naar home
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header location="Amsterdam" />

      {/* Navigation */}
      <div className="px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-2"
              data-testid="button-share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => favoriteMutation.mutate()}
              disabled={favoriteMutation.isPending}
              className="p-2"
              data-testid="button-favorite"
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
            </Button>
          </div>
        </div>
      </div>

      <main className="pb-24">
        {dealLoading ? (
          <div className="space-y-6">
            <Skeleton className="w-full h-64" />
            <div className="px-4 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ) : deal ? (
          <>
            {/* Deal Image */}
            {deal.imageUrl && (
              <div className="relative">
                <img 
                  src={deal.imageUrl} 
                  alt={deal.title}
                  className="w-full h-64 object-cover"
                  data-testid="img-deal-hero"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-accent text-accent-foreground" data-testid="badge-discount">
                    {deal.discountPercentage}% korting
                  </Badge>
                </div>
              </div>
            )}

            {/* Deal Info */}
            <section className="px-4 py-6">
              <div className="mb-4">
                <Badge variant="secondary" className="mb-3" data-testid="badge-category">
                  {deal.category.nameNl}
                </Badge>
                <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-deal-title">
                  {deal.title}
                </h1>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" />
                  <span data-testid="text-business-location">
                    {deal.business.name} • {deal.business.city}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    <span className="text-accent font-bold text-lg mr-2" data-testid="text-rating">
                      {deal.business.rating}
                    </span>
                    <div className="flex">
                      {renderStars(deal.business.rating)}
                    </div>
                    <span className="text-muted-foreground text-sm ml-2" data-testid="text-review-count">
                      ({deal.business.reviewCount} reviews)
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-3xl font-bold text-foreground" data-testid="text-discounted-price">
                    €{deal.discountedPrice}
                  </span>
                  <span className="text-xl text-muted-foreground line-through" data-testid="text-original-price">
                    €{deal.originalPrice}
                  </span>
                  <Badge className="bg-accent text-accent-foreground">
                    Bespaar €{(parseFloat(deal.originalPrice) - parseFloat(deal.discountedPrice)).toFixed(2)}
                  </Badge>
                </div>

                {/* Expiry */}
                {deal.expiresAt && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
                    <Clock className="w-4 h-4" />
                    <span data-testid="text-expires-at">
                      Geldig tot: {formatDate(deal.expiresAt)}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowReservation(true)}
                    data-testid="button-reserve"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Reserveren
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => setShowPayment(true)}
                    data-testid="button-buy"
                  >
                    Nu kopen
                  </Button>
                </div>
              </div>
            </section>

            <Separator />

            {/* Description */}
            <section className="px-4 py-6">
              <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-description-title">
                Over deze deal
              </h2>
              <p className="text-foreground leading-relaxed" data-testid="text-deal-description">
                {deal.description}
              </p>
            </section>

            <Separator />

            {/* Business Info */}
            <section className="px-4 py-6">
              <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-business-info-title">
                Over {deal.business.name}
              </h2>
              
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {deal.business.description && (
                      <p className="text-foreground" data-testid="text-business-description">
                        {deal.business.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground" data-testid="text-business-address">
                          {deal.business.address}, {deal.business.city}
                        </span>
                      </div>
                      
                      {deal.business.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground" data-testid="text-business-phone">
                            {deal.business.phone}
                          </span>
                        </div>
                      )}
                      
                      {deal.business.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <a 
                            href={deal.business.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                            data-testid="link-business-website"
                          >
                            Website bezoeken
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Reviews */}
            <section className="px-4 py-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground" data-testid="text-reviews-title">
                  Reviews ({deal.business.reviewCount})
                </h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowReview(true)}
                  data-testid="button-write-review"
                >
                  <Star className="h-4 w-4 mr-1" />
                  Review schrijven
                </Button>
              </div>
              
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-1/5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review: Review) => (
                    <Card key={review.id} data-testid={`card-review-${review.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              {review.user.firstName?.[0]}{review.user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-foreground" data-testid={`text-reviewer-name-${review.id}`}>
                                {review.user.firstName} {review.user.lastName?.[0]}.
                              </span>
                              <div className="flex">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < review.rating 
                                        ? "fill-accent text-accent" 
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-foreground mb-2" data-testid={`text-review-comment-${review.id}`}>
                              {review.comment}
                            </p>
                            <p className="text-xs text-muted-foreground" data-testid={`text-review-date-${review.id}`}>
                              {formatDate(review.createdAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {reviews.length > 3 && (
                    <Button variant="outline" className="w-full" data-testid="button-view-all-reviews">
                      Alle reviews bekijken ({reviews.length})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Card className="p-6 text-center" data-testid="card-no-reviews">
                    <Star className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-4">Nog geen reviews beschikbaar</p>
                    <Button 
                      onClick={() => setShowReview(true)}
                      data-testid="button-first-review"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Schrijf de eerste review
                    </Button>
                  </Card>
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>

      <BottomNavigation currentPage="home" />
      
      {deal && (
        <>
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

          <ReviewModal 
            isOpen={showReview}
            onClose={() => setShowReview(false)}
            deal={deal}
          />
        </>
      )}
    </div>
  );
}
