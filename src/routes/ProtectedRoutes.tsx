import { lazy } from "react";
import { ProtectedRouteType } from "@/types/routes";
import { UserManagementRoutes } from "@/modules/UserManagement";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

const ProtectedRoutes: ProtectedRouteType[] = [
  {
    path: "/dashboard",
    component: <Dashboard />,
    permission: "",
  },
  {
    path: "/settings",
    component: <SettingsPage />,
    permission: "",
  },
  ...UserManagementRoutes,
];

export default ProtectedRoutes;
