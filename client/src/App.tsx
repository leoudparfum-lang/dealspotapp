import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Search from "@/pages/search";
import Nearby from "@/pages/nearby";
import Netherlands from "@/pages/netherlands";
import Community from "@/pages/community";
import Vouchers from "@/pages/vouchers";
import Favorites from "@/pages/favorites";
import Profile from "@/pages/profile";
import DealDetail from "@/pages/deal-detail";
import BusinessDashboard from "@/pages/business-dashboard";
import AdminPanel from "@/pages/admin";
import BusinessLogin from "@/pages/business-login";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Business routes accessible without regular user authentication */}
      <Route path="/business" component={BusinessDashboard} />
      <Route path="/business-dashboard" component={BusinessDashboard} />
      <Route path="/business/login" component={BusinessLogin} />
      <Route path="/admin" component={AdminPanel} />
      
      {/* Regular user routes that depend on authentication */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/search" component={Search} />
          <Route path="/nearby" component={Nearby} />
          <Route path="/netherlands" component={Netherlands} />
          <Route path="/community" component={Community} />
          <Route path="/vouchers" component={Vouchers} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/profile" component={Profile} />
          <Route path="/deals/:id" component={DealDetail} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
