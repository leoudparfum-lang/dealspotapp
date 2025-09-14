import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import QRVoucher from "@/components/qr-voucher";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface Voucher {
  id: string;
  code: string;
  status: string;
  purchasedAt: string;
  usedAt?: string;
  expiresAt: string;
  deal: {
    id: string;
    title: string;
    discountedPrice: string;
  };
  business: {
    id: string;
    name: string;
  };
}

export default function Vouchers() {
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["/api/vouchers"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const useVoucherMutation = useMutation({
    mutationFn: async (voucherId: string) => {
      return apiRequest("PATCH", `/api/vouchers/${voucherId}/use`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      toast({
        title: "Voucher gebruikt",
        description: "Uw voucher is succesvol gebruikt!",
      });
      setSelectedVoucher(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Niet ingelogd",
          description: "U moet ingelogd zijn om vouchers te gebruiken",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het gebruiken van de voucher",
        variant: "destructive",
      });
    },
  });

  const filteredVouchers = vouchers.filter((voucher: Voucher) => {
    if (filter === "all") return true;
    if (filter === "active") return voucher.status === "active";
    if (filter === "used") return voucher.status === "used";
    if (filter === "expired") return voucher.status === "expired";
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-accent" />;
      case "used":
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      case "expired":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <QrCode className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-accent text-accent-foreground">Actief</Badge>;
      case "used":
        return <Badge variant="secondary">Gebruikt</Badge>;
      case "expired":
        return <Badge variant="destructive">Verlopen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const today = new Date();
    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header location="Amsterdam" />

      {/* Filter Tabs */}
      <div className="px-4 py-4 bg-card border-b border-border">
        <div className="flex space-x-1 overflow-x-auto">
          {[
            { id: "all", label: "Alle", count: vouchers.length },
            { id: "active", label: "Actief", count: vouchers.filter((v: Voucher) => v.status === "active").length },
            { id: "used", label: "Gebruikt", count: vouchers.filter((v: Voucher) => v.status === "used").length },
            { id: "expired", label: "Verlopen", count: vouchers.filter((v: Voucher) => v.status === "expired").length },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={filter === tab.id ? "default" : "secondary"}
              size="sm"
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === tab.id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
              }`}
              onClick={() => setFilter(tab.id)}
              data-testid={`button-filter-${tab.id}`}
            >
              {tab.label} ({tab.count})
            </Button>
          ))}
        </div>
      </div>

      <main className="pb-24">
        <section className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-vouchers-title">
              Mijn Vouchers
            </h1>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Totaal</p>
              <p className="text-lg font-semibold text-foreground" data-testid="text-total-vouchers">
                {vouchers.length} vouchers
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <Skeleton className="w-16 h-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredVouchers.length > 0 ? (
            <div className="space-y-4">
              {filteredVouchers.map((voucher: Voucher) => (
                <Card 
                  key={voucher.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => voucher.status === "active" && setSelectedVoucher(voucher)}
                  data-testid={`card-voucher-${voucher.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getStatusIcon(voucher.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground line-clamp-1" data-testid={`text-voucher-title-${voucher.id}`}>
                            {voucher.deal.title}
                          </h3>
                          {getStatusBadge(voucher.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2" data-testid={`text-voucher-business-${voucher.id}`}>
                          {voucher.business.name}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Gekocht: {formatDate(voucher.purchasedAt)}</span>
                          </div>
                          {voucher.status === "active" && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span className={isExpiringSoon(voucher.expiresAt) ? "text-destructive font-medium" : ""}>
                                Verloopt: {formatDate(voucher.expiresAt)}
                              </span>
                            </div>
                          )}
                          {voucher.usedAt && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Gebruikt: {formatDate(voucher.usedAt)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-lg font-bold text-foreground" data-testid={`text-voucher-price-${voucher.id}`}>
                            €{voucher.deal.discountedPrice}
                          </span>
                          {voucher.status === "active" && (
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVoucher(voucher);
                              }}
                              data-testid={`button-show-voucher-${voucher.id}`}
                            >
                              <QrCode className="h-3 w-3 mr-1" />
                              Tonen
                            </Button>
                          )}
                        </div>
                        
                        {isExpiringSoon(voucher.expiresAt) && voucher.status === "active" && (
                          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-xs text-destructive font-medium">
                              ⚠️ Verloopt binnenkort! Gebruik binnen 7 dagen.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center" data-testid="card-no-vouchers">
              <QrCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {filter === "all" ? "Geen vouchers" : `Geen ${filter} vouchers`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === "all" 
                  ? "U heeft nog geen vouchers gekocht. Ontdek geweldige deals en koop uw eerste voucher!"
                  : `U heeft geen ${filter} vouchers.`
                }
              </p>
              {filter === "all" && (
                <Button
                  onClick={() => window.location.href = "/"}
                  data-testid="button-browse-deals"
                >
                  Browse Deals
                </Button>
              )}
            </Card>
          )}
        </section>
      </main>

      <BottomNavigation currentPage="vouchers" />
      <div className="h-20"></div> {/* Space for fixed bottom navigation */}
      
      {selectedVoucher && (
        <QRVoucher
          voucher={selectedVoucher}
          isOpen={!!selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </div>
  );
}
