import { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

interface CanProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

interface CanAnyProps {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Can Component
 *
 * Conditionally renders children based on a single permission
 *
 * @example
 * <Can permission="users.create">
 *   <CreateUserButton />
 * </Can>
 */
export const Can = ({ permission, children, fallback = null }: CanProps) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * CanAny Component
 *
 * Conditionally renders children if user has ANY of the specified permissions
 *
 * @example
 * <CanAny permissions={["users.create", "users.update"]}>
 *   <UserActions />
 * </CanAny>
 */
export const CanAny = ({ permissions, children, fallback = null }: CanAnyProps) => {
  const { hasAnyPermission } = useAuth();

  if (!hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * CanAll Component
 *
 * Conditionally renders children if user has ALL of the specified permissions
 *
 * @example
 * <CanAll permissions={["users.view", "users.update"]}>
 *   <EditUserForm />
 * </CanAll>
 */
export const CanAll = ({ permissions, children, fallback = null }: CanAnyProps) => {
  const { hasAllPermissions } = useAuth();

  if (!hasAllPermissions(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
