import { ReactNode } from "react";

/**
 * Protected route configuration
 */
export interface ProtectedRouteType {
  path: string;
  component: ReactNode;
  permission?: string;
  anyPermission?: string[];
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
  children?: NavItem[];
  badge?: string | number;
  external?: boolean;
}
