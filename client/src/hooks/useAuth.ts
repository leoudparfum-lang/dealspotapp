import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Check if demo mode is active
  const isDemoMode = localStorage.getItem('demo-mode') === 'true';
  
  const { data: user, isLoading } = useQuery({
    queryKey: isDemoMode ? ["/api/demo/user"] : ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isDemoMode,
  };
}
