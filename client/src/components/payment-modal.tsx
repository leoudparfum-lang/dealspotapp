import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Smartphone, Building2, Lock, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface Deal {
  id: string;
  title: string;
  discountedPrice: string;
  originalPrice: string;
  discountPercentage: number;
  business: {
    name: string;
  };
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
}

export default function PaymentModal({ isOpen, onClose, deal }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("ideal");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [idealBank, setIdealBank] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [step, setStep] = useState<"payment" | "processing" | "success">("payment");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/payments/process", {
        method: "POST",
        body: {
          dealId: deal.id,
          paymentMethod,
          amount: deal.discountedPrice,
          ...(paymentMethod === "creditcard" && {
            cardDetails: {
              number: cardNumber,
              expiryDate,
              cvv,
              name: cardName,
            }
          }),
          ...(paymentMethod === "ideal" && {
            idealBank,
          }),
        }
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      setStep("success");
      setTimeout(() => {
        handleClose();
        toast({
          title: "Betaling succesvol",
          description: "Uw voucher is beschikbaar in 'Mijn Vouchers'",
        });
      }, 2000);
    },
    onError: (error) => {
      setStep("payment");
      if (isUnauthorizedError(error)) {
        toast({
          title: "Niet ingelogd",
          description: "U moet ingelogd zijn om een betaling te doen",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Betaling mislukt",
        description: error.message || "Er is een fout opgetreden bij het verwerken van de betaling",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (!agreeTerms) {
      toast({
        title: "Algemene voorwaarden",
        description: "U moet akkoord gaan met de algemene voorwaarden",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "ideal" && !idealBank) {
      toast({
        title: "Bank selecteren",
        description: "Selecteer uw bank voor iDEAL betaling",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "creditcard") {
      if (!cardNumber || !expiryDate || !cvv || !cardName) {
        toast({
          title: "Creditcard gegevens",
          description: "Vul alle creditcard gegevens in",
          variant: "destructive",
        });
        return;
      }
    }

    setStep("processing");
    paymentMutation.mutate();
  };

  const handleClose = () => {
    onClose();
    setStep("payment");
    setCardNumber("");
    setExpiryDate("");
    setCvv("");
    setCardName("");
    setIdealBank("");
    setAgreeTerms(false);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const banks = [
    "ABN AMRO",
    "ING",
    "Rabobank",
    "SNS Bank",
    "ASN Bank",
    "Knab",
    "Triodos Bank",
    "Van Lanschot",
    "RegioBank",
  ];

  if (step === "processing") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md" data-testid="payment-processing-modal" aria-describedby="processing-description">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-processing-title">
              Betaling verwerken...
            </h3>
            <p id="processing-description" className="text-muted-foreground" data-testid="text-processing-description">
              Uw betaling wordt verwerkt. Dit kan enkele seconden duren.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === "success") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md" data-testid="payment-success-modal" aria-describedby="success-description">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-success-title">
              Betaling succesvol!
            </h3>
            <p id="success-description" className="text-muted-foreground mb-4" data-testid="text-success-description">
              Uw voucher is beschikbaar in 'Mijn Vouchers'
            </p>
            <Badge className="bg-accent text-accent-foreground" data-testid="badge-voucher-ready">
              Voucher klaar voor gebruik
            </Badge>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="payment-modal" aria-describedby="payment-description">
        <DialogHeader>
          <DialogTitle data-testid="payment-modal-title">
            Betaling afronden
          </DialogTitle>
          <div id="payment-description" className="sr-only">
            Voltooi uw bestelling door uw betaalgegevens in te voeren
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3" data-testid="text-order-summary">
                Bestelsamenvat
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Deal:</span>
                  <span className="text-sm font-medium text-foreground" data-testid="text-deal-title">
                    {deal.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Locatie:</span>
                  <span className="text-sm text-foreground" data-testid="text-business-name">
                    {deal.business.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Originele prijs:</span>
                  <span className="text-sm text-muted-foreground line-through" data-testid="text-original-price">
                    €{deal.originalPrice}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Korting:</span>
                  <span className="text-sm text-accent font-medium" data-testid="text-discount">
                    -{deal.discountPercentage}%
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold text-foreground">Totaal:</span>
                  <span className="text-lg font-bold text-foreground" data-testid="text-total-price">
                    €{deal.discountedPrice}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-foreground">Betaalmethode kiezen</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                <RadioGroupItem value="ideal" id="ideal" data-testid="radio-ideal" />
                <Label htmlFor="ideal" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <span>iDEAL</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                <RadioGroupItem value="creditcard" id="creditcard" data-testid="radio-creditcard" />
                <Label htmlFor="creditcard" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Creditcard</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                <RadioGroupItem value="paypal" id="paypal" data-testid="radio-paypal" />
                <Label htmlFor="paypal" className="flex items-center space-x-2 cursor-pointer flex-1">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>PayPal</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* iDEAL Bank Selection */}
          {paymentMethod === "ideal" && (
            <div className="space-y-2">
              <Label>Selecteer uw bank</Label>
              <Select value={idealBank} onValueChange={setIdealBank}>
                <SelectTrigger data-testid="select-ideal-bank">
                  <SelectValue placeholder="Kies uw bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank} value={bank.toLowerCase().replace(/\s+/g, "")}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Credit Card Form */}
          {paymentMethod === "creditcard" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Kaartnummer</Label>
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  data-testid="input-card-number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vervaldatum</Label>
                  <Input
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    data-testid="input-expiry-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CVV</Label>
                  <Input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substring(0, 3))}
                    placeholder="123"
                    maxLength={3}
                    data-testid="input-cvv"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Naam op kaart</Label>
                <Input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Zoals op de kaart staat"
                  data-testid="input-card-name"
                />
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="terms" 
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(checked === true)}
              data-testid="checkbox-terms"
            />
            <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
              Ik ga akkoord met de{" "}
              <a href="#" className="text-primary hover:underline">
                algemene voorwaarden
              </a>{" "}
              en{" "}
              <a href="#" className="text-primary hover:underline">
                privacybeleid
              </a>
            </Label>
          </div>

          {/* Security Notice */}
          <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Uw betaalgegevens worden veilig versleuteld
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleClose}
              disabled={paymentMutation.isPending}
              data-testid="button-cancel-payment"
            >
              Annuleren
            </Button>
            <Button 
              className="flex-1"
              onClick={handlePayment}
              disabled={paymentMutation.isPending || !agreeTerms}
              data-testid="button-confirm-payment"
            >
              {paymentMutation.isPending ? "Verwerken..." : `Betaal €${deal.discountedPrice}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
