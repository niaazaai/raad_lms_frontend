/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react";
import { ProtectedRouteType } from "@/types/routes";

const ActivityLogList = lazy(() => import("../features/ActivityLogList/ActivityLogList"));

/**
 * Audit log viewer — backend allows only users with Spatie role `root` (super admin).
 */
export const ActivityLogRoutes: ProtectedRouteType[] = [
  {
    path: "/activity-log",
    component: <ActivityLogList />,
    permission: "",
    anyRole: ["root"],
  },
];

export default ActivityLogRoutes;
