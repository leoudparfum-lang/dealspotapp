import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Building, MapPin, Phone, Mail, User, Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface BusinessLoginData {
  email: string;
  password: string;
}

interface BusinessRegisterData {
  // Business info
  businessName: string;
  description: string;
  category: string;
  phone: string;
  website: string;
  
  // Address
  address: string;
  city: string;
  postalCode: string;
  
  // Contact person
  contactName: string;
  contactEmail: string;
  contactPassword: string;
  contactPasswordConfirm: string;
}

export default function BusinessLogin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  
  const [loginData, setLoginData] = useState<BusinessLoginData>({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState<BusinessRegisterData>({
    businessName: "",
    description: "",
    category: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    postalCode: "",
    contactName: "",
    contactEmail: "",
    contactPassword: "",
    contactPasswordConfirm: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: BusinessLoginData) => {
      return await apiRequest("/api/business/login", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Succesvol ingelogd!",
        description: `Welkom terug, ${data.business.name}`,
      });
      localStorage.setItem("business-session", JSON.stringify(data));
      window.location.href = "/business";
    },
    onError: () => {
      toast({
        title: "Login mislukt",
        description: "Controleer je email en wachtwoord",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: BusinessRegisterData) => {
      return await apiRequest("/api/business/register", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Registratie succesvol!",
        description: `Account aangemaakt voor ${data.business.name}. Je kunt nu inloggen.`,
      });
      
      // Auto-fill login form with registration credentials
      setLoginData({
        email: registerData.contactEmail,
        password: registerData.contactPassword
      });
      
      setActiveTab("login");
    },
    onError: (error: any) => {
      toast({
        title: "Registratie mislukt",
        description: error.message || "Er ging iets mis bij het registreren",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.contactPassword !== registerData.contactPasswordConfirm) {
      toast({
        title: "Wachtwoorden komen niet overeen",
        description: "Controleer je wachtwoord bevestiging",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back to main app */}
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar DealSpot
          </Button>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Business Portal</CardTitle>
            <p className="text-muted-foreground">
              Voor restaurants, winkels en dienstverleners
            </p>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Inloggen</TabsTrigger>
                <TabsTrigger value="register">Registreren</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      placeholder="bedrijf@example.com"
                      required
                      data-testid="input-business-email"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Wachtwoord</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      placeholder="••••••••"
                      required
                      data-testid="input-business-password"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-business-login"
                  >
                    {loginMutation.isPending ? "Inloggen..." : "Inloggen"}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-6">
                  {/* Business Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Bedrijfsgegevens
                    </h3>
                    
                    <div>
                      <Label htmlFor="businessName">Bedrijfsnaam *</Label>
                      <Input
                        id="businessName"
                        value={registerData.businessName}
                        onChange={(e) => setRegisterData({...registerData, businessName: e.target.value})}
                        placeholder="Restaurant De Smaak"
                        required
                        data-testid="input-business-name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Categorie *</Label>
                      <Select
                        value={registerData.category}
                        onValueChange={(value) => setRegisterData({...registerData, category: value})}
                      >
                        <SelectTrigger data-testid="select-business-category">
                          <SelectValue placeholder="Kies een categorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="retail">Winkel</SelectItem>
                          <SelectItem value="fitness">Fitness & Sport</SelectItem>
                          <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                          <SelectItem value="services">Dienstverlening</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Telefoon</Label>
                        <Input
                          id="phone"
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                          placeholder="020-1234567"
                          data-testid="input-business-phone"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={registerData.website}
                          onChange={(e) => setRegisterData({...registerData, website: e.target.value})}
                          placeholder="www.example.com"
                          data-testid="input-business-website"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Adresgegevens
                    </h3>
                    
                    <div>
                      <Label htmlFor="address">Adres *</Label>
                      <Input
                        id="address"
                        value={registerData.address}
                        onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                        placeholder="Hoofdstraat 123"
                        required
                        data-testid="input-business-address"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Stad *</Label>
                        <Input
                          id="city"
                          value={registerData.city}
                          onChange={(e) => setRegisterData({...registerData, city: e.target.value})}
                          placeholder="Amsterdam"
                          required
                          data-testid="input-business-city"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="postalCode">Postcode</Label>
                        <Input
                          id="postalCode"
                          value={registerData.postalCode}
                          onChange={(e) => setRegisterData({...registerData, postalCode: e.target.value})}
                          placeholder="1234AB"
                          data-testid="input-business-postal"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Contactpersoon
                    </h3>
                    
                    <div>
                      <Label htmlFor="contactName">Naam *</Label>
                      <Input
                        id="contactName"
                        value={registerData.contactName}
                        onChange={(e) => setRegisterData({...registerData, contactName: e.target.value})}
                        placeholder="Jan de Vries"
                        required
                        data-testid="input-contact-name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contactEmail">Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={registerData.contactEmail}
                        onChange={(e) => setRegisterData({...registerData, contactEmail: e.target.value})}
                        placeholder="jan@restaurant.com"
                        required
                        data-testid="input-contact-email"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contactPassword">Wachtwoord *</Label>
                        <Input
                          id="contactPassword"
                          type="password"
                          value={registerData.contactPassword}
                          onChange={(e) => setRegisterData({...registerData, contactPassword: e.target.value})}
                          placeholder="••••••••"
                          required
                          data-testid="input-contact-password"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contactPasswordConfirm">Bevestig Wachtwoord *</Label>
                        <Input
                          id="contactPasswordConfirm"
                          type="password"
                          value={registerData.contactPasswordConfirm}
                          onChange={(e) => setRegisterData({...registerData, contactPasswordConfirm: e.target.value})}
                          placeholder="••••••••"
                          required
                          data-testid="input-contact-password-confirm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={registerMutation.isPending}
                    data-testid="button-business-register"
                  >
                    {registerMutation.isPending ? "Registreren..." : "Account Aanmaken"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Demo Login:</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Email: <code>demo@restaurant.com</code><br />
                Wachtwoord: <code>demo123</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}