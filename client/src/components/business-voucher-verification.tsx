import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Scan, CheckCircle, XCircle, Clock, AlertCircle, Camera, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import QrScanner from 'qr-scanner';

interface VoucherInfo {
  id: string;
  code: string;
  status: string;
  purchasedAt: string;
  usedAt?: string;
  expiresAt: string;
  deal: {
    id: string;
    title: string;
    description: string;
    originalPrice: string;
    discountedPrice: string;
    discountPercentage: number;
  };
  business: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  user: {
    id: string;
    email: string;
  };
}

interface VerificationResult {
  valid: boolean;
  voucher: VoucherInfo;
  message: string;
}

interface BusinessVoucherVerificationProps {
  businessId: string;
}

export default function BusinessVoucherVerification({ businessId }: BusinessVoucherVerificationProps) {
  const { toast } = useToast();
  const [voucherCode, setVoucherCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const handleVerifyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast({
        title: "Voucher code vereist",
        description: "Voer een geldige voucher code in",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setVerificationResult(null);

    try {
      const result = await apiRequest("/api/business/vouchers/verify", {
        method: "POST",
        body: { code: voucherCode.trim() },
      });

      setVerificationResult(result);

      if (!result.valid) {
        toast({
          title: "Ongeldige voucher",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verificatie mislukt",
        description: error.message || "Kon voucher niet verifiëren",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemVoucher = async () => {
    if (!verificationResult?.voucher) return;

    setIsLoading(true);

    try {
      const result = await apiRequest("/api/business/vouchers/redeem", {
        method: "POST",
        body: { 
          code: voucherCode.trim(),
          businessId: businessId
        },
      });

      if (result.success) {
        toast({
          title: "Voucher ingewisseld! ✅",
          description: "De voucher is succesvol ingewisseld",
        });

        // Update verification result to show as used
        setVerificationResult(prev => prev ? {
          ...prev,
          voucher: {
            ...prev.voucher,
            status: "used",
            usedAt: new Date().toISOString()
          }
        } : null);
      }
    } catch (error: any) {
      toast({
        title: "Inwisselen mislukt",
        description: error.message || "Kon voucher niet inwisselen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto redeem voucher when QR is scanned
  const handleAutoRedeemVoucher = async (code: string) => {
    setIsLoading(true);

    try {
      // First verify the voucher
      const verification = await apiRequest("/api/business/vouchers/verify", {
        method: "POST",
        body: { code: code.trim() },
      });

      if (!verification.valid) {
        toast({
          title: "Ongeldige voucher",
          description: verification.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if voucher belongs to this business
      if (verification.voucher.business.id !== businessId) {
        toast({
          title: "Verkeerde business",
          description: `Deze voucher is voor ${verification.voucher.business.name}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Auto-redeem the voucher
      const redeemResult = await apiRequest("/api/business/vouchers/redeem", {
        method: "POST",
        body: { 
          code: code.trim(),
          businessId: businessId
        },
      });

      if (redeemResult.success) {
        // Set verification result
        setVerificationResult({
          valid: true,
          voucher: {
            ...verification.voucher,
            status: "used",
            usedAt: new Date().toISOString()
          },
          message: "Voucher automatisch ingewisseld"
        });

        // Send notification to app owner
        await sendRedemptionNotification(verification.voucher);

        // Process payment to business
        await processBusinessPayment(verification.voucher);

        toast({
          title: "🎉 Voucher Goedgekeurd!",
          description: `${verification.voucher.deal.title} - €${verification.voucher.deal.discountedPrice} uitbetaald`,
          duration: 5000,
        });
      }
    } catch (error: any) {
      toast({
        title: "Auto-inwisseling mislukt",
        description: error.message || "Kon voucher niet automatisch inwisselen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send notification to app owner
  const sendRedemptionNotification = async (voucher: any) => {
    try {
      await apiRequest("/api/notifications", {
        method: "POST",
        body: {
          userId: voucher.user.id,
          title: "Voucher Ingewisseld ✅",
          message: `Uw voucher voor "${voucher.deal.title}" is succesvol gebruikt bij ${voucher.business.name}`,
          type: "voucher_redeemed"
        }
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  // Process payment to business
  const processBusinessPayment = async (voucher: any) => {
    try {
      await apiRequest("/api/business/payments/process", {
        method: "POST",
        body: {
          businessId: businessId,
          voucherId: voucher.id,
          amount: parseFloat(voucher.deal.discountedPrice),
          description: `Voucher uitbetaling: ${voucher.deal.title}`
        }
      });
      
      console.log(`Payment of €${voucher.deal.discountedPrice} processed for business`);
    } catch (error) {
      console.error("Failed to process payment:", error);
      // Don't show error to user as voucher is still redeemed
    }
  };

  const startQrScanner = async () => {
    if (!videoRef.current) return;

    try {
      setShowQrScanner(true);
      
      // Request camera permissions explicitly
      await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result: QrScanner.ScanResult) => {
          console.log('QR Code scanned:', result.data);
          
          // Extract voucher code from QR data
          let scannedCode = result.data;
          
          // If QR contains just the voucher code
          if (scannedCode.startsWith('DS-')) {
            setVoucherCode(scannedCode);
            stopQrScanner();
            
            toast({
              title: "QR Code gescand! 📱",
              description: "Automatisch verifiëren en goedkeuren...",
            });
            
            // Automatically verify and redeem the voucher
            await handleAutoRedeemVoucher(scannedCode);
          } else {
            toast({
              title: "Ongeldig QR Code",
              description: "Dit is geen geldige voucher QR code",
              variant: "destructive",
            });
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera on mobile
          maxScansPerSecond: 5, // Limit scanning frequency
        }
      );

      await qrScannerRef.current.start();
      
      toast({
        title: "Camera actief 📷",
        description: "Richt de camera op de QR code van de voucher",
      });
      
    } catch (error) {
      console.error('QR Scanner error:', error);
      toast({
        title: "Camera fout",
        description: "Kon camera niet starten. Geef camera toestemming in je browser.",
        variant: "destructive",
      });
      setShowQrScanner(false);
    }
  };

  const stopQrScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setShowQrScanner(false);
  };

  // Cleanup QR scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "used":
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case "expired":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Actief</Badge>;
      case "used":
        return <Badge variant="secondary">Gebruikt</Badge>;
      case "expired":
        return <Badge variant="destructive">Verlopen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isExpired = verificationResult?.voucher ? 
    new Date(verificationResult.voucher.expiresAt) < new Date() : false;

  return (
    <div className="space-y-6">
      {/* Voucher Code Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Voucher Verificatie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voucher-code">Voucher Code</Label>
              <div className="flex gap-2">
                <Input
                  id="voucher-code"
                  placeholder="Bijv: DS-1757346000-ABC123"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyVoucher()}
                  className="flex-1"
                  data-testid="input-voucher-code"
                />
                <Button 
                  variant="outline"
                  onClick={startQrScanner}
                  disabled={isLoading || showQrScanner}
                  data-testid="button-scan-qr"
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={handleVerifyVoucher}
                  disabled={isLoading}
                  data-testid="button-verify-voucher"
                >
                  {isLoading ? "Controleren..." : "Controleren"}
                </Button>
              </div>
            </div>

            {/* QR Scanner Modal */}
            {showQrScanner && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 m-4 max-w-sm w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">QR Code Scanner</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={stopQrScanner}
                      data-testid="button-close-scanner"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full h-64 bg-black rounded-lg"
                      playsInline
                    />
                    <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                      <div className="absolute inset-4 border border-white/50 rounded"></div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Richt de camera op de QR code van de voucher
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            Voer de voucher code in die de klant toont op hun telefoon of print.
          </p>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {verificationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(verificationResult.voucher.status)}
                Voucher Details
              </span>
              {getStatusBadge(verificationResult.voucher.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Deal Information */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{verificationResult.voucher.deal.title}</h3>
                <p className="text-muted-foreground">{verificationResult.voucher.deal.description}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-lg font-bold text-green-600">
                  €{verificationResult.voucher.deal.discountedPrice}
                </div>
                <div className="text-sm text-muted-foreground line-through">
                  €{verificationResult.voucher.deal.originalPrice}
                </div>
                <Badge variant="outline">
                  -{verificationResult.voucher.deal.discountPercentage}% korting
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Customer & Purchase Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Klant Email</Label>
                <p className="font-medium">{verificationResult.voucher.user.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Gekocht op</Label>
                <p className="font-medium">{formatDate(verificationResult.voucher.purchasedAt)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Vervalt op</Label>
                <p className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
                  {formatDate(verificationResult.voucher.expiresAt)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Voucher Code</Label>
                <p className="font-mono text-xs">{verificationResult.voucher.code}</p>
              </div>
            </div>

            {verificationResult.voucher.status === "used" && verificationResult.voucher.usedAt && (
              <div className="text-sm">
                <Label className="text-muted-foreground">Gebruikt op</Label>
                <p className="font-medium">{formatDate(verificationResult.voucher.usedAt)}</p>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-3">
              {verificationResult.valid && verificationResult.voucher.status === "active" && !isExpired && (
                <Button 
                  onClick={handleRedeemVoucher}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-redeem-voucher"
                >
                  {isLoading ? "Inwisselen..." : "✅ Voucher Inwisselen"}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setVoucherCode("");
                  setVerificationResult(null);
                }}
                data-testid="button-clear-result"
              >
                Nieuwe Voucher
              </Button>
            </div>

            {/* Warning Messages */}
            {!verificationResult.valid && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Voucher niet geldig</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{verificationResult.message}</p>
              </div>
            )}

            {verificationResult.valid && isExpired && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Voucher verlopen</span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  Deze voucher is verlopen en kan niet meer worden ingewisseld.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}