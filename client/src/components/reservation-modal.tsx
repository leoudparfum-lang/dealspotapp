import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
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

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
}

export default function ReservationModal({ isOpen, onClose, deal }: ReservationModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [specialRequests, setSpecialRequests] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reservationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime) {
        throw new Error("Datum en tijd zijn verplicht");
      }

      const reservationDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":");
      reservationDateTime.setHours(parseInt(hours), parseInt(minutes));

      const response = await apiRequest("/api/reservations", {
        method: "POST",
        body: {
          dealId: deal.id,
          businessId: deal.businessId,
          reservationDate: reservationDateTime.toISOString(),
          partySize: parseInt(partySize),
          specialRequests: specialRequests || null,
        }
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Reservering bevestigd",
        description: `Uw reservering voor ${deal.business.name} is bevestigd!`,
      });
      onClose();
      resetForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Niet ingelogd",
          description: "U moet ingelogd zijn om een reservering te maken",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Reservering mislukt",
        description: error.message || "Er is een fout opgetreden bij het maken van de reservering",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setPartySize("2");
    setSpecialRequests("");
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const timeSlots = [
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
  ];

  const partySizeOptions = Array.from({ length: 8 }, (_, i) => (i + 1).toString());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="reservation-modal" aria-describedby="reservation-description">
        <DialogHeader>
          <DialogTitle data-testid="reservation-modal-title">
            Reservering maken
          </DialogTitle>
          <p id="reservation-description" className="text-sm text-muted-foreground" data-testid="reservation-business-name">
            {deal.business.name} - {deal.title}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Datum selecteren</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-select-date"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: nl }) : "Kies een datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Tijd selecteren</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger data-testid="select-time">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Kies een tijd" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Party Size */}
          <div className="space-y-2">
            <Label>Aantal personen</Label>
            <Select value={partySize} onValueChange={setPartySize}>
              <SelectTrigger data-testid="select-party-size">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {partySizeOptions.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size} {size === "1" ? "persoon" : "personen"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label>Speciale verzoeken (optioneel)</Label>
            <Textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Bijv. vegetarisch menu, raamtafel, etc."
              className="resize-none"
              rows={3}
              data-testid="textarea-special-requests"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleClose}
              disabled={reservationMutation.isPending}
              data-testid="button-cancel-reservation"
            >
              Annuleren
            </Button>
            <Button 
              className="flex-1"
              onClick={() => reservationMutation.mutate()}
              disabled={reservationMutation.isPending || !selectedDate || !selectedTime}
              data-testid="button-confirm-reservation"
            >
              {reservationMutation.isPending ? "Bevestigen..." : "Reserveren"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
