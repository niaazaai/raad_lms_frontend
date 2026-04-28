import { ReactNode } from "react";

/**
 * Protected route configuration
 */
export interface ProtectedRouteType {
  path: string;
  component: ReactNode;
  permission?: string;
  anyPermission?: string[];
  /** If set, user must have one of these Spatie role names (e.g. `root` for super admin). */
  anyRole?: string[];
  routes?: ProtectedRouteType[];
  componentLoader?: ReactNode;
}

/**
 * Navigation item for menus
 */
export interface NavItem {
  title: string;
  path: string;
  icon?: ReactNode;
  permission?: string;
  /** User must have one of these Spatie role names (sidebar visibility). */
  anyRole?: string[];
  children?: NavItem[];
  badge?: string | number;
  external?: boolean;
}
