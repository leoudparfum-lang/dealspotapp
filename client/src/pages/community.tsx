import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, ArrowUp, MessageCircle, Users, TrendingUp, Clock } from "lucide-react";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";

interface Business {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface DealNomination {
  id: string;
  title: string;
  description: string;
  suggestedDiscount: string;
  reason: string;
  upvotes: number;
  status: "active" | "responded" | "closed";
  businessResponse?: string;
  business: Business;
  createdAt: string;
  hasUserVoted?: boolean;
}

export default function CommunityPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const [formData, setFormData] = useState({
    businessId: "",
    title: "",
    description: "",
    suggestedDiscount: "",
    reason: "",
  });

  const { data: businesses = [] } = useQuery({
    queryKey: ["/api/businesses"],
  });

  const { data: nominations = [], isLoading: nominationsLoading } = useQuery({
    queryKey: ["/api/community/nominations"],
  });

  const submitNominationMutation = useMutation({
    mutationFn: async (nominationData: any) => {
      return await apiRequest("/api/community/nominations", {
        method: "POST",
        body: nominationData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Deal voorstel ingediend!",
        description: "Je voorstel is toegevoegd. Andere gebruikers kunnen nu stemmen!",
      });
      setFormData({
        businessId: "",
        title: "",
        description: "",
        suggestedDiscount: "",
        reason: "",
      });
      setSelectedBusiness(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/community/nominations"] });
    },
    onError: () => {
      toast({
        title: "Fout bij indienen",
        description: "Er ging iets mis. Probeer het opnieuw.",
        variant: "destructive",
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ nominationId, voteType }: { nominationId: string; voteType: string }) => {
      return await apiRequest(`/api/community/nominations/${nominationId}/vote`, {
        method: "POST",
        body: { voteType },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/nominations"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitNominationMutation.mutateAsync(formData);
  };

  const handleVote = (nominationId: string) => {
    voteMutation.mutate({ nominationId, voteType: "upvote" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "responded": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Community laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Community Deals</h1>
              <p className="text-muted-foreground">Stel deals voor en stem op favorieten</p>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)} 
              disabled={!isAuthenticated}
              data-testid="button-add-nomination"
            >
              <Plus className="w-4 h-4 mr-2" />
              Voorstel Doen
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                <p className="text-lg font-bold">{nominations.length}</p>
                <p className="text-xs text-muted-foreground">Voorstellen</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 mx-auto text-green-500 mb-2" />
                <p className="text-lg font-bold">
                  {nominations.filter((n: DealNomination) => n.status === "responded").length}
                </p>
                <p className="text-xs text-muted-foreground">Reacties</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <ArrowUp className="w-6 h-6 mx-auto text-purple-500 mb-2" />
                <p className="text-lg font-bold">
                  {nominations.reduce((acc: number, n: DealNomination) => acc + n.upvotes, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Totaal Stemmen</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 mx-auto text-orange-500 mb-2" />
                <p className="text-lg font-bold">
                  {nominations.filter((n: DealNomination) => n.status === "active").length}
                </p>
                <p className="text-xs text-muted-foreground">Actief</p>
              </CardContent>
            </Card>
          </div>

          {/* Nomination Form */}
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Nieuw Deal Voorstel</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="business">Bedrijf *</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.businessId}
                      onChange={(e) => {
                        const business = businesses.find((b: Business) => b.id === e.target.value);
                        setFormData({ ...formData, businessId: e.target.value });
                        setSelectedBusiness(business || null);
                      }}
                      required
                      data-testid="select-business"
                    >
                      <option value="">Selecteer een bedrijf</option>
                      {businesses.map((business: Business) => (
                        <option key={business.id} value={business.id}>
                          {business.name} - {business.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="title">Deal Titel *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="bijv. Korting op fitness abonnement"
                      required
                      data-testid="input-title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="suggestedDiscount">Voorgestelde Korting *</Label>
                    <Input
                      id="suggestedDiscount"
                      value={formData.suggestedDiscount}
                      onChange={(e) => setFormData({ ...formData, suggestedDiscount: e.target.value })}
                      placeholder="bijv. 30% korting of €15 korting"
                      required
                      data-testid="input-discount"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Beschrijving *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Beschrijf wat voor deal je voor ogen hebt..."
                      rows={3}
                      required
                      data-testid="textarea-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reason">Waarom zou dit een goede deal zijn?</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Vertel waarom deze deal geweldig zou zijn voor de community..."
                      rows={2}
                      data-testid="textarea-reason"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={submitNominationMutation.isPending} className="flex-1">
                      {submitNominationMutation.isPending ? "Indienen..." : "Voorstel Indienen"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Annuleren
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Nominations List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Community Voorstellen</h2>
            
            {nominationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : nominations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Nog geen community voorstellen</p>
                  {isAuthenticated && (
                    <Button onClick={() => setShowForm(true)}>
                      Eerste Voorstel Doen
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              nominations.map((nomination: DealNomination) => (
                <Card key={nomination.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{nomination.title}</h3>
                          <Badge className={getStatusColor(nomination.status)}>
                            {nomination.status === "active" ? "Actief" : 
                             nomination.status === "responded" ? "Reactie" : "Gesloten"}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {nomination.business.name} • {nomination.business.city}
                        </p>
                        
                        <p className="text-sm mb-2">{nomination.description}</p>
                        
                        <div className="text-sm">
                          <span className="font-medium text-primary">
                            Voorgestelde korting: {nomination.suggestedDiscount}
                          </span>
                        </div>
                        
                        {nomination.reason && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            "{nomination.reason}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant={nomination.hasUserVoted ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleVote(nomination.id)}
                          disabled={!isAuthenticated || voteMutation.isPending}
                          data-testid={`button-vote-${nomination.id}`}
                        >
                          <ArrowUp className="w-4 h-4 mr-1" />
                          {nomination.upvotes}
                        </Button>
                        
                        <span className="text-sm text-muted-foreground">
                          {new Date(nomination.createdAt).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>

                    {nomination.businessResponse && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">Reactie van {nomination.business.name}</span>
                        </div>
                        <p className="text-sm text-green-700">{nomination.businessResponse}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNavigation currentPage="community" />
    </div>
  );
}