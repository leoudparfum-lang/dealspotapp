import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Upload, Eye, Clock, CheckCircle, XCircle, TrendingUp, Building, CreditCard, AlertCircle, Camera, X, MapPin, Scan, QrCode } from "lucide-react";
import BusinessLocationMap from "@/components/business-location-map";
import BusinessVoucherVerification from "@/components/business-voucher-verification";
import { GeocodingService } from "@/lib/geocoding";

interface DealSubmission {
  id: string;
  title: string;
  description: string;
  originalPrice: string;
  discountedPrice: string;
  categoryId: string;
  imageUrls?: string[];
  terms?: string;
  availableCount?: number;
  validUntil: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  createdAt: string;
}

interface Category {
  id: string;
  nameNl?: string;
  name?: string;
}

export default function BusinessDashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [businessSession, setBusinessSession] = useState<any>(null);

  // Check business authentication
  useEffect(() => {
    const session = localStorage.getItem('business-session');
    if (session) {
      try {
        setBusinessSession(JSON.parse(session));
      } catch {
        localStorage.removeItem('business-session');
      }
    }
  }, []);

  const isBusinessUser = !!businessSession;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    originalPrice: "",
    discountedPrice: "",
    categoryId: "",
    terms: "",
    availableCount: "",
    validUntil: "",
    businessAddress: "",
    businessCity: "",
  });

  // Location state for map
  const [locationData, setLocationData] = useState<{
    latitude: number | null;
    longitude: number | null;
    isGeocoding: boolean;
    isLocationConfirmed: boolean;
  }>({
    latitude: null,
    longitude: null,
    isGeocoding: false,
    isLocationConfirmed: false,
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Geocoding function
  const geocodeAddress = async (address: string, city: string) => {
    if (!address.trim() || !city.trim()) {
      setLocationData(prev => ({ ...prev, latitude: null, longitude: null, isLocationConfirmed: false }));
      return;
    }

    setLocationData(prev => ({ ...prev, isGeocoding: true }));

    try {
      // First try full geocoding
      let result = await GeocodingService.geocodeAddress(address, city);
      
      // If that fails, try known city coordinates
      if (!result) {
        result = GeocodingService.getKnownCityCoordinates(city);
      }

      if (result) {
        setLocationData({
          latitude: result.latitude,
          longitude: result.longitude,
          isGeocoding: false,
          isLocationConfirmed: true,
        });
        
        toast({
          title: "Locatie gevonden!",
          description: `Adres succesvol gevonden: ${result.displayName}`,
        });
      } else {
        setLocationData(prev => ({ 
          ...prev, 
          latitude: null, 
          longitude: null, 
          isGeocoding: false,
          isLocationConfirmed: false 
        }));
        
        toast({
          title: "Locatie niet gevonden",
          description: "Kon het adres niet vinden. Controleer of het adres en de stad correct zijn.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationData(prev => ({ 
        ...prev, 
        isGeocoding: false,
        isLocationConfirmed: false 
      }));
      
      toast({
        title: "Fout bij locatie zoeken",
        description: "Er ging iets mis bij het zoeken van de locatie.",
        variant: "destructive",
      });
    }
  };

  // Auto-geocode when address and city are filled
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.businessAddress && formData.businessCity) {
        geocodeAddress(formData.businessAddress, formData.businessCity);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.businessAddress, formData.businessCity]);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Get business limits
  const { data: businessLimits } = useQuery({
    queryKey: ["/api/business/limits"],
    enabled: isBusinessUser,
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<any[]>({
    queryKey: ["/api/business/submissions"],
    enabled: isBusinessUser,
  });

  const submitDealMutation = useMutation({
    mutationFn: async (dealData: any) => {
      return await apiRequest("/api/business/deals/submit", {
        method: "POST",
        body: dealData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Deal ingediend!",
        description: "Je deal is ingediend voor goedkeuring. Je ontvangt bericht zodra deze is beoordeeld.",
      });
      setFormData({
        title: "",
        description: "",
        originalPrice: "",
        discountedPrice: "",
        categoryId: "",
        terms: "",
        availableCount: "",
        validUntil: "",
        businessAddress: "",
        businessCity: "",
      });
      setLocationData({
        latitude: null,
        longitude: null,
        isGeocoding: false,
        isLocationConfirmed: false,
      });
      setUploadedImages([]);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/business/submissions"] });
    },
    onError: (error: any) => {
      const errorData = JSON.parse(error.message.split(': ')[1] || '{}');
      
      if (errorData.requiresPayment) {
        toast({
          title: "Gratis limiet bereikt!",
          description: `Je hebt ${errorData.freeDealsUsed} van ${errorData.maxFreeDeals} gratis deals gebruikt. Extra deals kosten €${errorData.pricePerDeal} per stuk.`,
          variant: "destructive",
        });
        setShowPaymentModal(true);
      } else {
        toast({
          title: "Fout bij indienen",
          description: "Er ging iets mis bij het indienen van je deal. Probeer het opnieuw.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const discountPercentage = Math.round(
        ((parseFloat(formData.originalPrice) - parseFloat(formData.discountedPrice)) / 
         parseFloat(formData.originalPrice)) * 100
      );

      await submitDealMutation.mutateAsync({
        ...formData,
        originalPrice: parseFloat(formData.originalPrice),
        discountedPrice: parseFloat(formData.discountedPrice),
        availableCount: formData.availableCount ? parseInt(formData.availableCount) : undefined,
        discountPercentage,
        imageUrls: uploadedImages,
        businessLatitude: locationData.latitude,
        businessLongitude: locationData.longitude,
      });
    } catch (error) {
      console.error("Error submitting deal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Upload handlers
  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("/api/objects/upload", {
        method: "POST",
      });
      return response;
    } catch (error) {
      console.error("Error getting upload URL:", error);
      throw error;
    }
  };

  const handleUploadComplete = async (uploadedUrls: string[]) => {
    try {
      // Convert Google Cloud Storage URLs to frontend object URLs
      const convertedUrls = await Promise.all(
        uploadedUrls.map(async (url) => {
          try {
            const response = await apiRequest("/api/objects/convert-url", {
              method: "POST",
              body: { rawUrl: url }
            });
            return response.objectPath;
          } catch (error) {
            console.error("Error converting URL:", error);
            return url; // Fallback to original URL
          }
        })
      );
      setUploadedImages(prev => [...prev, ...convertedUrls].slice(0, 4));
    } catch (error) {
      console.error("Error in handleUploadComplete:", error);
      setUploadedImages(prev => [...prev, ...uploadedUrls].slice(0, 4));
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const maxFiles = 4 - uploadedImages.length;
    const filesToUpload = Array.from(files).slice(0, maxFiles);
    
    try {
      for (const file of filesToUpload) {
        // Get upload URL
        const uploadParams = await handleGetUploadParameters();
        
        // Upload file to Google Cloud Storage
        const uploadResponse = await fetch(uploadParams.url, {
          method: uploadParams.method,
          body: file,
          headers: {
            'Content-Type': file.type
          }
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }
        
        // Convert the uploaded URL to frontend object URL
        const convertedUrls = await handleUploadComplete([uploadParams.url]);
      }
      
      // Reset the file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload fout",
        description: "Er ging iets mis bij het uploaden van de foto's. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  if (!isBusinessUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-4">Business Dashboard</h2>
            <p className="text-muted-foreground mb-4">
              Je hebt een business account nodig om deals toe te voegen.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = "/business/login"}
                className="w-full"
              >
                Inloggen als Business
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/"}
                className="w-full"
              >
                Terug naar DealSpot
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Business Dashboard</h1>
            <p className="text-muted-foreground">
              Welkom {businessSession?.business?.name} • {businessSession?.business?.city}
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={() => {
                if (businessLimits?.subscriptionStatus === 'free' && businessLimits?.remainingFreeDeals <= 0) {
                  setShowPaymentModal(true);
                  return;
                }
                setShowForm(!showForm);
                // Scroll to form after short delay to allow rendering
                setTimeout(() => {
                  const formElement = document.getElementById('deal-form');
                  if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }} 
              data-testid="button-add-deal"
              className={businessLimits?.subscriptionStatus === 'free' && businessLimits?.remainingFreeDeals <= 0 ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              <Plus className="w-4 h-4 mr-2" />
              {businessLimits?.subscriptionStatus === 'free' && businessLimits?.remainingFreeDeals <= 0 ? 'Upgrade voor Deal' : 'Nieuwe Deal'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.removeItem('business-session');
                window.location.href = '/business/login';
              }}
            >
              Uitloggen
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">In behandeling</p>
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
                  <p className="text-2xl font-bold">
                    {submissions.filter((s: DealSubmission) => s.status === "approved").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Totaal verkocht</p>
                  <p className="text-2xl font-bold">247</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Deze maand</p>
                  <p className="text-2xl font-bold">1.2k</p>
                  <p className="text-xs text-muted-foreground">weergaven</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deal Submission Form */}
          {showForm && (
            <div id="deal-form" className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Nieuwe Deal Indienen</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Deal Titel *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="bijv. 50% korting op massage"
                          required
                          data-testid="input-title"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="category">Categorie *</Label>
                        <Select
                          value={formData.categoryId}
                          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                        >
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Kies categorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category: Category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.nameNl || category.name || category.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Beschrijving *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Beschrijf je deal in detail..."
                        rows={3}
                        required
                        data-testid="textarea-description"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="originalPrice">Originele Prijs (€) *</Label>
                        <Input
                          id="originalPrice"
                          type="number"
                          step="0.01"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                          placeholder="59.99"
                          required
                          data-testid="input-original-price"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="discountedPrice">Deal Prijs (€) *</Label>
                        <Input
                          id="discountedPrice"
                          type="number"
                          step="0.01"
                          value={formData.discountedPrice}
                          onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                          placeholder="29.99"
                          required
                          data-testid="input-discounted-price"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="availableCount">Beschikbaar</Label>
                        <Input
                          id="availableCount"
                          type="number"
                          value={formData.availableCount}
                          onChange={(e) => setFormData({ ...formData, availableCount: e.target.value })}
                          placeholder="100"
                          data-testid="input-available-count"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="validUntil">Geldig tot *</Label>
                        <Input
                          id="validUntil"
                          type="date"
                          value={formData.validUntil}
                          onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                          required
                          data-testid="input-valid-until"
                        />
                      </div>
                    </div>

                    {/* Locatie informatie sectie */}
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-4">📍 Locatie Informatie</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Deze informatie is nodig zodat je deal op de kaart verschijnt en klanten je kunnen vinden.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessAddress">Bedrijfsadres *</Label>
                          <Input
                            id="businessAddress"
                            value={formData.businessAddress}
                            onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                            placeholder="bijv. Damrak 123"
                            required
                            data-testid="input-business-address"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="businessCity">Stad *</Label>
                          <Select
                            value={formData.businessCity}
                            onValueChange={(value) => setFormData({ ...formData, businessCity: value })}
                          >
                            <SelectTrigger data-testid="select-business-city">
                              <SelectValue placeholder="Kies stad" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              <SelectItem value="Amsterdam">Amsterdam</SelectItem>
                              <SelectItem value="Rotterdam">Rotterdam</SelectItem>
                              <SelectItem value="Den Haag">Den Haag</SelectItem>
                              <SelectItem value="Utrecht">Utrecht</SelectItem>
                              <SelectItem value="Eindhoven">Eindhoven</SelectItem>
                              <SelectItem value="Groningen">Groningen</SelectItem>
                              <SelectItem value="Maastricht">Maastricht</SelectItem>
                              <SelectItem value="Breda">Breda</SelectItem>
                              <SelectItem value="Nijmegen">Nijmegen</SelectItem>
                              <SelectItem value="Haarlem">Haarlem</SelectItem>
                              <SelectItem value="Zwolle">Zwolle</SelectItem>
                              <SelectItem value="Apeldoorn">Apeldoorn</SelectItem>
                              <SelectItem value="Amersfoort">Amersfoort</SelectItem>
                              <SelectItem value="Dordrecht">Dordrecht</SelectItem>
                              <SelectItem value="Naarden">Naarden</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Locatie kaart */}
                      <BusinessLocationMap
                        latitude={locationData.latitude}
                        longitude={locationData.longitude}
                        address={formData.businessAddress}
                        city={formData.businessCity}
                        businessName={formData.title || "Jouw bedrijf"}
                        isLocationConfirmed={locationData.isLocationConfirmed}
                        className="mt-4"
                        onMapClick={(lat, lng, address, city) => {
                          // Update location data
                          setLocationData(prev => ({
                            ...prev,
                            latitude: lat,
                            longitude: lng,
                            isLocationConfirmed: true
                          }));
                          
                          // Update form data if we got address/city from reverse geocoding
                          if (address || city) {
                            setFormData(prev => ({
                              ...prev,
                              businessAddress: address || prev.businessAddress,
                              businessCity: city || prev.businessCity
                            }));
                          }
                          
                          toast({
                            title: "Locatie geselecteerd",
                            description: address && city 
                              ? `Adres ingesteld op: ${address}, ${city}`
                              : "Locatie ingesteld via kaart klik"
                          });
                        }}
                      />
                      
                      {/* Geocoding status */}
                      {locationData.isGeocoding && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span>Locatie zoeken...</span>
                        </div>
                      )}
                      
                      {formData.businessAddress && formData.businessCity && !locationData.latitude && !locationData.isGeocoding && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 mt-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Locatie niet gevonden. Controleer het adres.</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="terms">Voorwaarden</Label>
                      <Textarea
                        id="terms"
                        value={formData.terms}
                        onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                        placeholder="Voorwaarden en beperkingen..."
                        rows={2}
                        data-testid="textarea-terms"
                      />
                    </div>

                    {/* Foto Upload Section */}
                    <div>
                      <Label>Deal Foto's (Aanbevolen: 4 foto's)</Label>
                      <div className="mt-2">
                        <div className="space-y-4">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            id="deal-photos"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById('deal-photos')?.click()}
                            data-testid="button-upload-photos"
                          >
                            <div className="flex items-center gap-2">
                              <Camera className="w-4 h-4" />
                              <span>Foto's Uploaden (Max 4)</span>
                            </div>
                          </Button>
                        </div>
                        
                        {/* Display uploaded images */}
                        {uploadedImages.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                              Geüploade foto's ({uploadedImages.length}/4):
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {uploadedImages.map((imageUrl, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={imageUrl}
                                    alt={`Deal foto ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    data-testid={`button-remove-image-${index}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1"
                        data-testid="button-submit-deal"
                      >
                        {isSubmitting ? "Indienen..." : "Deal Indienen"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowForm(false)}
                        data-testid="button-cancel"
                      >
                        Annuleren
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submitted Deals List */}
          <div className={showForm ? "lg:col-span-1" : "lg:col-span-3"}>
            <Card>
              <CardHeader>
                <CardTitle>Ingediende Deals</CardTitle>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <Plus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nog geen deals ingediend</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowForm(true)}
                      className="mt-2"
                    >
                      Eerste Deal Toevoegen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission: DealSubmission) => (
                      <div 
                        key={submission.id} 
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`submission-${submission.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{submission.title}</h4>
                          <Badge className={getStatusColor(submission.status)}>
                            {getStatusIcon(submission.status)}
                            <span className="ml-1 capitalize">{submission.status}</span>
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {submission.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            €{parseFloat(submission.discountedPrice).toFixed(2)} 
                            <span className="line-through ml-2">
                              €{parseFloat(submission.originalPrice).toFixed(2)}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(submission.createdAt).toLocaleDateString('nl-NL')}
                          </span>
                        </div>
                        
                        {submission.adminNotes && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <strong>Admin notitie:</strong> {submission.adminNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Upgrade naar Pro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Gratis limiet bereikt!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Je hebt 2 gratis deals gebruikt. Voor meer deals upgraden naar Pro:
                  </p>
                  
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <div className="text-2xl font-bold">€5</div>
                    <div className="text-sm text-muted-foreground">per extra deal</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1"
                  >
                    Later
                  </Button>
                  <Button 
                    onClick={async () => {
                      try {
                        await apiRequest('/api/business/purchase-deal-credits', {
                          method: 'POST',
                          body: { creditCount: 1 }
                        });
                        
                        toast({
                          title: "Upgrade succesvol!",
                          description: "Je hebt nu onbeperkt deals. Pro account geactiveerd!",
                        });
                        
                        setShowPaymentModal(false);
                        queryClient.invalidateQueries({ queryKey: ["/api/business/limits"] });
                      } catch (error) {
                        toast({
                          title: "Payment mislukt",
                          description: "Er ging iets mis. Probeer het opnieuw.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="flex-1"
                  >
                    Upgrade Nu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Voucher Verification Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Voucher Verificatie
              </CardTitle>
            </CardHeader>
            <CardContent>
              {businessSession?.business?.id && (
                <BusinessVoucherVerification businessId={businessSession.business.id} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}