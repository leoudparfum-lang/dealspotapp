import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import NetherlandsMap from "@/components/netherlands-map";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";

export default function NetherlandsPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Auto-redirect handled by App.tsx routing

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Kaart laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20">
        <div className="max-w-md mx-auto p-4">
          <NetherlandsMap />
        </div>
      </main>

      <BottomNavigation currentPage="netherlands" />
    </div>
  );
}