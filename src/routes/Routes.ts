import { ProtectedRouteType } from "@/types/routes";
import { UserManagementRoutes } from "@/modules/UserManagement";

const routes: {
  userManagement: ProtectedRouteType[];
} = {
  userManagement: UserManagementRoutes,
};

export default routes;
