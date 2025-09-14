import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, Users, TrendingUp, AlertTriangle, Settings } from "lucide-react";

interface DealSubmission {
  id: string;
  title: string;
  description: string;
  originalPrice: string;
  discountedPrice: string;
  status: "pending" | "approved" | "rejected";
  business: {
    name: string;
    city: string;
  };
  createdAt: string;
}

interface Nomination {
  id: string;
  title: string;
  description: string;
  upvotes: number;
  status: string;
  business: {
    name: string;
    city: string;
  };
}

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Get real deal submissions from API
  const { data: submissions = [] } = useQuery<DealSubmission[]>({
    queryKey: ["/api/admin/pending-deals"],
  });

  const { data: nominations = [] } = useQuery({
    queryKey: ["/api/community/nominations"],
  });

  const approveMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      return await apiRequest(`/api/admin/deals/${submissionId}`, {
        method: "PATCH",
        body: { status: "approved" }
      });
    },
    onSuccess: () => {
      toast({
        title: "Deal goedgekeurd!",
        description: "De deal is succesvol goedgekeurd en verschijnt nu op de homepage.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals/featured"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ submissionId, reason }: { submissionId: string; reason: string }) => {
      return await apiRequest(`/api/admin/deals/${submissionId}`, {
        method: "PATCH",
        body: { status: "rejected", adminNotes: reason },
      });
    },
    onSuccess: () => {
      toast({
        title: "Deal afgewezen",
        description: "De deal is afgewezen met een reden.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-deals"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4" />;
      case "rejected": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleApprove = (submissionId: string) => {
    approveMutation.mutate(submissionId);
  };

  const handleReject = (submissionId: string) => {
    const reason = prompt("Reden voor afwijzing:");
    if (reason) {
      rejectMutation.mutate({ submissionId, reason });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Beheer deals, gebruikers en platform</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Admin Panel</Badge>
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Terug naar App
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          {[
            { id: "overview", label: "Overzicht", icon: TrendingUp },
            { id: "submissions", label: "Deal Aanvragen", icon: Clock },
            { id: "nominations", label: "Community", icon: Users },
            { id: "settings", label: "Instellingen", icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                selectedTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">Wachtend</p>
                      <p className="text-2xl font-bold">
                        {submissions.filter((s: DealSubmission) => s.status === "pending").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">Goedgekeurd</p>
                      <p className="text-2xl font-bold">47</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">Actieve Gebruikers</p>
                      <p className="text-2xl font-bold">1,234</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">Deze Maand</p>
                      <p className="text-2xl font-bold">€12,450</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recente Activiteit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">Deal goedgekeurd: 3-gangen menu</p>
                      <p className="text-sm text-muted-foreground">Restaurant De Smaak • 2 uur geleden</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">Nieuwe community nominatie</p>
                      <p className="text-sm text-muted-foreground">FitZone Gym • 4 uur geleden</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <div className="flex-1">
                      <p className="font-medium">Deal aanvraag ingediend</p>
                      <p className="text-sm text-muted-foreground">Café Central • 6 uur geleden</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Submissions Tab */}
        {selectedTab === "submissions" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deal Aanvragen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.map((submission: DealSubmission) => (
                    <div key={submission.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{submission.title}</h3>
                            <Badge className={getStatusColor(submission.status)}>
                              {getStatusIcon(submission.status)}
                              <span className="ml-1 capitalize">{submission.status}</span>
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {submission.business.name} • {submission.business.city}
                          </p>
                          
                          <p className="text-sm mb-3">{submission.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span>
                              <strong>Was:</strong> €{parseFloat(submission.originalPrice).toFixed(2)}
                            </span>
                            <span>
                              <strong>Nu:</strong> €{parseFloat(submission.discountedPrice).toFixed(2)}
                            </span>
                            <span className="text-green-600">
                              <strong>Korting:</strong> {Math.round(((parseFloat(submission.originalPrice) - parseFloat(submission.discountedPrice)) / parseFloat(submission.originalPrice)) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {submission.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(submission.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Goedkeuren
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(submission.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Afwijzen
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Nominations Tab */}
        {selectedTab === "nominations" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Nominaties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nominations.map((nomination: Nomination) => (
                    <div key={nomination.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium mb-2">{nomination.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {nomination.business.name} • {nomination.business.city}
                          </p>
                          <p className="text-sm mb-3">{nomination.description}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">
                              {nomination.upvotes} stemmen
                            </span>
                            <Badge variant="outline">
                              {nomination.status === "active" ? "Actief" : "Responded"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {selectedTab === "settings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Instellingen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Automatische Goedkeuring</Label>
                  <p className="text-sm text-muted-foreground">
                    Deals van geverifieerde bedrijven automatisch goedkeuren
                  </p>
                </div>
                
                <div>
                  <Label>Notificatie Instellingen</Label>
                  <p className="text-sm text-muted-foreground">
                    Beheer notificaties voor nieuwe aanvragen
                  </p>
                </div>
                
                <div>
                  <Label>Community Moderatie</Label>
                  <p className="text-sm text-muted-foreground">
                    Instellingen voor community nominaties en moderatie
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}