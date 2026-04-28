import { ProtectedRouteType } from "@/types/routes";
import { UserManagementRoutes } from "@/modules/UserManagement";
import { CourseModuleRoutes } from "@/modules/Course/routes";
import { ActivityLogRoutes } from "@/modules/ActivityLog";

const routes: {
  userManagement: ProtectedRouteType[];
  course: ProtectedRouteType[];
  activityLog: ProtectedRouteType[];
} = {
  userManagement: UserManagementRoutes,
  course: CourseModuleRoutes,
  activityLog: ActivityLogRoutes,
};

export default routes;
