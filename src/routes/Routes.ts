import { ProtectedRouteType } from "@/types/routes";
import { UserManagementRoutes } from "@/modules/UserManagement";
import { CourseModuleRoutes } from "@/modules/Course/routes";

const routes: {
  userManagement: ProtectedRouteType[];
  course: ProtectedRouteType[];
} = {
  userManagement: UserManagementRoutes,
  course: CourseModuleRoutes,
};

export default routes;
