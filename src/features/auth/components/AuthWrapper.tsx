import { useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "@/store";
import { AuthStatus } from "@/data/enums";
import { useAuth } from "../hooks/useAuth";

interface AuthWrapperProps {
  children: ReactNode;
  loginPath?: string;
}

const AuthWrapper = ({ children, loginPath = "/login" }: AuthWrapperProps) => {
  const location = useLocation();
  const { user, status } = useAuth();
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (status === AuthStatus.LOADING || status === AuthStatus.IDLE) {
    return <AppLoader />;
  }

  if (!user && (status === AuthStatus.UNAUTHENTICATED || status === AuthStatus.FAILED)) {
    window.location.href = `${loginPath}?redirect=${encodeURIComponent(location.pathname)}`;
    return null;
  }

  return <>{children}</>;
};

/**
 * Simple loading spinner for auth check
 */
const AppLoader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default AuthWrapper;
