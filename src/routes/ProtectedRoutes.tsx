import { lazy } from "react";
import { ProtectedRouteType } from "@/types/routes";
import { UserManagementRoutes } from "@/modules/UserManagement";
import { CourseModuleRoutes } from "@/modules/Course/routes";

import { ActivityLogRoutes } from "@/modules/ActivityLog";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
const CoursePlayerPage = lazy(() => import("@/modules/Course/features/CoursePlayerPage/CoursePlayerPage"));

const ProtectedRoutes: ProtectedRouteType[] = [
  {
    path: "/dashboard",
    component: <Dashboard />,
    permission: "",
  },
  {
    path: "/student",
    component: <StudentDashboard />,
    permission: "",
    anyRole: ["student"],
  },
  {
    path: "/learn/course/:courseId",
    component: <CoursePlayerPage />,
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
