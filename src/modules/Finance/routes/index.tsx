import { lazy } from "react";
import type { ProtectedRouteType } from "@/types/routes";

const FinanceReportPage = lazy(() => import("../features/FinanceReportPage/FinanceReportPage"));
const ReceivePaymentPage = lazy(() => import("../features/ReceivePaymentPage/ReceivePaymentPage"));

export const FinanceRoutes: ProtectedRouteType[] = [
  {
    path: "/finance",
    component: <FinanceReportPage />,
    permission: "finance.read",
  },
  {
    path: "/finance/receive-payment",
    component: <ReceivePaymentPage />,
    anyPermission: ["course.class_students.payment", "course.class_students.update"],
  },
];

export default FinanceRoutes;
