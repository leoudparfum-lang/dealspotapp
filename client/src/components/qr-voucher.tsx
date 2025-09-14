import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Share2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Voucher {
  id: string;
  code: string;
  expiresAt: string;
  deal: {
    title: string;
  };
  business: {
    name: string;
  };
}

interface QRVoucherProps {
  voucher: Voucher;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRVoucher({ voucher, isOpen, onClose }: QRVoucherProps) {
  const { toast } = useToast();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      toast({
        title: "Gekopieerd",
        description: "Voucher code is gekopieerd naar het klembord",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon de code niet kopiëren",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `DealSpot Voucher - ${voucher.deal.title}`,
          text: `Mijn voucher code: ${voucher.code}`,
        });
      } catch (error) {
        // User cancelled the share
      }
    } else {
      // Fallback to copying
      handleCopyCode();
    }
  };

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="voucher-modal" aria-describedby="voucher-description">
        <DialogHeader>
          <DialogTitle className="text-center" data-testid="voucher-modal-title">
            Uw Voucher
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
            <QrCode className="h-10 w-10 text-primary-foreground" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="voucher-deal-title">
              {voucher.deal.title}
            </h3>
            <p id="voucher-description" className="text-muted-foreground" data-testid="voucher-business-name">
              Toon deze QR-code bij {voucher.business.name}
            </p>
          </div>

          {/* QR Code Placeholder - In a real app, this would generate an actual QR code */}
          <Card className="mx-auto w-48 h-48 border-2">
            <CardContent className="p-0 h-full flex items-center justify-center">
              <div className="text-center">
                <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">QR Code</p>
                <p className="text-xs text-muted-foreground mt-1">{voucher.code}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-foreground">Voucher Code:</p>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <p className="text-lg font-bold text-primary" data-testid="voucher-code">
                  {voucher.code}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="p-1 h-auto"
                  data-testid="button-copy-code"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2" data-testid="voucher-expiry">
                Geldig tot: {formatExpiryDate(voucher.expiresAt)}
              </p>
            </CardContent>
          </Card>

          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleShare}
              data-testid="button-share-voucher"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Delen
            </Button>
            <Button 
              className="flex-1"
              onClick={onClose}
              data-testid="button-close-voucher"
            >
              Sluiten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
