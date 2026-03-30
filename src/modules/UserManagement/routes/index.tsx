import { lazy } from "react";
import { ProtectedRouteType } from "@/types/routes";

// Lazy load components
const UserList = lazy(() => import("../features/UserList/UserList"));
const RoleList = lazy(() => import("../features/RoleList/RoleList"));
const RoleDetail = lazy(() => import("../features/RoleDetail/RoleDetail"));
const RoleForm = lazy(() => import("../features/RoleForm/RoleForm"));
const PermissionList = lazy(() => import("../features/PermissionList/PermissionList"));

/**
 * User Management module routes
 */
export const UserManagementRoutes: ProtectedRouteType[] = [
  // Users (create/edit via drawer on list page)
  {
    path: "/users",
    component: <UserList />,
    permission: "users.read",
  },
  // Roles (literal paths before /roles/:id so create and edit match first)
  {
    path: "/roles",
    component: <RoleList />,
    permission: "roles.read",
  },
  {
    path: "/roles/create",
    component: <RoleForm mode="create" />,
    permission: "roles.create",
  },
  {
    path: "/roles/:id/edit",
    component: <RoleForm mode="edit" />,
    permission: "roles.update",
  },
  {
    path: "/roles/:id",
    component: <RoleDetail />,
    permission: "roles.read",
  },
  // Permissions
  {
    path: "/permissions",
    component: <PermissionList />,
    permission: "permissions.read",
  },
];

export default UserManagementRoutes;
