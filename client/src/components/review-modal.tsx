import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface Deal {
  id: string;
  title: string;
  businessId: string;
  business: {
    name: string;
  };
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
}

export default function ReviewModal({ isOpen, onClose, deal }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/reviews", {
        method: "POST",
        body: {
          businessId: deal.businessId,
          dealId: deal.id,
          rating,
          comment: comment.trim() || null,
        }
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Review geplaatst",
        description: "Bedankt voor uw review!",
      });
      onClose();
      resetForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Niet ingelogd",
          description: "U moet ingelogd zijn om een review te schrijven",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Review mislukt",
        description: error.message || "Er is een fout opgetreden bij het plaatsen van uw review",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setRating(0);
    setComment("");
    setHoveredRating(0);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Beoordeling vereist",
        description: "Geef een sterrenrating voor deze deal",
        variant: "destructive",
      });
      return;
    }

    reviewMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="review-modal" aria-describedby="review-description">
        <DialogHeader>
          <DialogTitle data-testid="review-modal-title">
            Review schrijven
          </DialogTitle>
          <p id="review-description" className="text-sm text-muted-foreground" data-testid="review-business-name">
            {deal.business.name} - {deal.title}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Uw beoordeling</Label>
            <div className="flex space-x-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 cursor-pointer transition-colors ${
                    i < (hoveredRating || rating) 
                      ? "fill-accent text-accent" 
                      : "text-muted-foreground hover:text-accent/50"
                  }`}
                  onClick={() => handleRatingClick(i + 1)}
                  onMouseEnter={() => setHoveredRating(i + 1)}
                  onMouseLeave={() => setHoveredRating(0)}
                  data-testid={`star-${i + 1}`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {rating > 0 ? `${rating} van 5 sterren` : "Klik op een ster om te beoordelen"}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label>Uw ervaring (optioneel)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Vertel ons over uw ervaring met deze deal..."
              className="resize-none"
              rows={4}
              data-testid="textarea-review-comment"
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/500 karakters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleClose}
              disabled={reviewMutation.isPending}
              data-testid="button-cancel-review"
            >
              Annuleren
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSubmit}
              disabled={reviewMutation.isPending || rating === 0}
              data-testid="button-submit-review"
            >
              {reviewMutation.isPending ? "Versturen..." : "Review plaatsen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}