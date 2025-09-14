import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Percent, MapPin, Star, Shield, Smartphone, CreditCard } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <header className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Percent className="text-primary-foreground text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">DealSpot</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                localStorage.setItem('demo-mode', 'true');
                window.location.reload();
              }}
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              data-testid="button-demo-header"
            >
              🚀 Demo
            </Button>
            <Button 
              onClick={() => window.location.href = '/api/login'} 
              size="lg"
              className="bg-primary hover:bg-primary/90"
              data-testid="button-login"
            >
              Inloggen
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <div className="text-center py-16">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Ontdek de beste deals
            <br />
            <span className="text-primary">in uw buurt</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Bespaar tot 70% op restaurants, wellness, hotels en activiteiten. 
            Meer dan 10.000 deals beschikbaar met digitale vouchers en instant reserveringen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-6"
              data-testid="button-get-started"
            >
              Inloggen met Replit
              <MapPin className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={() => {
                localStorage.setItem('demo-mode', 'true');
                window.location.reload();
              }}
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              data-testid="button-demo"
            >
              🚀 Demo Modus
              <Smartphone className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 py-16">
          <Card className="border-border hover:shadow-lg transition-shadow" data-testid="card-location-deals">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Locatiegebaseerde Deals</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Vind automatisch de beste aanbiedingen in uw directe omgeving. 
                Van restaurants tot wellnesscentra.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow" data-testid="card-digital-vouchers">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-xl">Digitale Vouchers</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                QR-codes in uw telefoon, geen papieren vouchers meer nodig. 
                Direct te gebruiken na aankoop.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow" data-testid="card-instant-booking">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-xl">Instant Reserveren</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Reserveer direct tafels, hotelkamers en wellness-sessies. 
                Betaal veilig met iDEAL of creditcard.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="bg-card rounded-2xl border border-border p-8 my-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div data-testid="stat-deals">
              <div className="text-4xl font-bold text-primary mb-2">10.000+</div>
              <div className="text-muted-foreground">Actieve deals</div>
            </div>
            <div data-testid="stat-savings">
              <div className="text-4xl font-bold text-accent mb-2">70%</div>
              <div className="text-muted-foreground">Gemiddelde besparing</div>
            </div>
            <div data-testid="stat-customers">
              <div className="text-4xl font-bold text-secondary mb-2">250.000+</div>
              <div className="text-muted-foreground">Tevreden klanten</div>
            </div>
            <div data-testid="stat-rating">
              <div className="flex items-center justify-center mb-2">
                <span className="text-4xl font-bold text-foreground mr-2">4.8</span>
                <Star className="h-8 w-8 fill-accent text-accent" />
              </div>
              <div className="text-muted-foreground">App beoordeling</div>
            </div>
          </div>
        </div>

        {/* Categories Preview */}
        <div className="py-16">
          <h3 className="text-3xl font-bold text-center text-foreground mb-8">
            Populaire Categorieën
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Restaurants", icon: "🍽️", deals: "2.500+ deals" },
              { name: "Wellness", icon: "🧘‍♀️", deals: "1.200+ deals" },
              { name: "Hotels", icon: "🏨", deals: "800+ deals" },
              { name: "Activiteiten", icon: "🎯", deals: "1.100+ deals" }
            ].map((category, index) => (
              <Card key={index} className="border-border hover:shadow-md transition-shadow cursor-pointer" data-testid={`category-${category.name.toLowerCase()}`}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h4 className="font-semibold text-foreground mb-1">{category.name}</h4>
                  <p className="text-sm text-muted-foreground">{category.deals}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary rounded-2xl p-12 text-center my-16">
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Begin vandaag nog met besparen
          </h3>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Gratis registreren en direct toegang tot duizenden exclusieve deals
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-6"
            data-testid="button-cta-register"
          >
            Gratis Account Aanmaken
            <Shield className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Percent className="text-primary-foreground text-sm" />
              </div>
              <span className="text-lg font-semibold text-foreground">DealSpot</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 DealSpot. Alle rechten voorbehouden.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
