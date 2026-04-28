import { lazy } from "react";
import { ProtectedRouteType } from "@/types/routes";
import { UserManagementRoutes } from "@/modules/UserManagement";
import { CourseModuleRoutes } from "@/modules/Course/routes";

import { ActivityLogRoutes } from "@/modules/ActivityLog";

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
  ...ActivityLogRoutes,
  ...CourseModuleRoutes,
];

export default ProtectedRoutes;
