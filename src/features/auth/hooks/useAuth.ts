import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/store";
import { AuthStatus } from "@/data/enums";

/**
 * Custom hook for auth-related operations
 *
 * Provides:
 * - User state
 * - Permission checking
 * - Auth status
 * - Login/logout actions
 */
export const useAuth = () => {
  const {
    user,
    status,
    permissions,
    login,
    logout,
    fetchUser,
    verify2FA,
    pending2FA,
    setPending2FA,
  } = useAuthStore();

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      // Bypass auth check in development if VITE_DISABLE_AUTH is set
      if (import.meta.env.VITE_DISABLE_AUTH === "true") {
        return true;
      }

      // Empty permission means no restriction
      if (!permission) {
        return true;
      }

      return permissions.includes(permission);
    },
    [permissions]
  );

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (permissionList: string[]): boolean => {
      if (import.meta.env.VITE_DISABLE_AUTH === "true") {
        return true;
      }

      if (!permissionList || permissionList.length === 0) {
        return true;
      }

      return permissionList.some((permission) => permissions.includes(permission));
    },
    [permissions]
  );

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = useCallback(
    (permissionList: string[]): boolean => {
      if (import.meta.env.VITE_DISABLE_AUTH === "true") {
        return true;
      }

      if (!permissionList || permissionList.length === 0) {
        return true;
      }

      return permissionList.every((permission) => permissions.includes(permission));
    },
    [permissions]
  );

  /**
   * Spatie role names from `/auth/me` (e.g. `admin`, `root`, `student`).
   */
  const hasAnyRole = useCallback(
    (roleNames: string[]): boolean => {
      if (import.meta.env.VITE_DISABLE_AUTH === "true") {
        return true;
      }
      if (!roleNames || roleNames.length === 0) {
        return true;
      }
      const roles = user?.roles ?? [];
      return roleNames.some((r) => roles.includes(r));
    },
    [user?.roles]
  );

  /**
   * Derived states
   */
  const isAuthenticated = useMemo(
    () => status === AuthStatus.AUTHENTICATED && user !== null,
    [status, user]
  );

  const isLoading = useMemo(
    () => status === AuthStatus.LOADING || status === AuthStatus.IDLE,
    [status]
  );

  const isFailed = useMemo(() => status === AuthStatus.FAILED, [status]);

  return {
    user,
    status,
    permissions,
    pending2FA,
    isAuthenticated,
    isLoading,
    isFailed,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    login,
    verify2FA,
    setPending2FA,
    logout,
    fetchUser,
  };
};
