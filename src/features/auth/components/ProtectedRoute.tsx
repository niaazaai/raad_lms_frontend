import { ReactNode, memo } from "react";
import { useAuth } from "../hooks/useAuth";
import PermissionDeniedCard from "./PermissionDeniedCard";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  anyPermission?: string[];
  anyRole?: string[];
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
const ProtectedRoute = ({ children, permission, anyPermission, anyRole, fallback }: ProtectedRouteProps) => {
  const { hasPermission, hasAnyPermission, hasAnyRole } = useAuth();

  if (anyRole && anyRole.length > 0) {
    if (!hasAnyRole(anyRole)) {
      return fallback || <PermissionDeniedCard />;
    }
  }

  if (anyPermission && anyPermission.length > 0) {
    if (!hasAnyPermission(anyPermission)) {
      return fallback || <PermissionDeniedCard />;
    }
  } else if (permission) {
    if (!hasPermission(permission)) {
      return fallback || <PermissionDeniedCard />;
    }
  }

  return <>{children}</>;
};

export default memo(ProtectedRoute);
