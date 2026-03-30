import { ReactNode, memo } from "react";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  anyPermission?: string[];
  fallback?: ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Wraps route content to check permissions:
 * - If permission is required, checks if user has it
 * - If anyPermission array is provided, checks if user has any of them
 * - Shows unauthorized fallback if permission check fails
 */
const ProtectedRoute = ({ children, permission, anyPermission, fallback }: ProtectedRouteProps) => {
  const { hasPermission, hasAnyPermission } = useAuth();

  // Check permissions
  if (anyPermission && anyPermission.length > 0) {
    if (!hasAnyPermission(anyPermission)) {
      return fallback || <UnauthorizedFallback />;
    }
  } else if (permission) {
    if (!hasPermission(permission)) {
      return fallback || <UnauthorizedFallback />;
    }
  }

  return <>{children}</>;
};

/**
 * Default unauthorized fallback component
 */
const UnauthorizedFallback = () => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold text-danger">403</h1>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="mb-6 text-muted-foreground">
          You do not have permission to access this page.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-active"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
};

export default memo(ProtectedRoute);
