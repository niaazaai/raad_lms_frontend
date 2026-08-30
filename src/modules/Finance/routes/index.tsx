import { lazy } from "react";
import type { ProtectedRouteType } from "@/types/routes";

const FinanceReportPage = lazy(() => import("../features/FinanceReportPage/FinanceReportPage"));
const ReceivePaymentPage = lazy(() => import("../features/ReceivePaymentPage/ReceivePaymentPage"));
const InvoicesPage = lazy(() => import("../features/InvoicesPage/InvoicesPage"));
const ManualInvoicePage = lazy(() => import("../features/ManualInvoicePage/ManualInvoicePage"));
const ManualInvoicesPage = lazy(() => import("../features/ManualInvoicesPage/ManualInvoicesPage"));
const UpcomingDuesPage = lazy(() => import("../features/UpcomingDuesPage/UpcomingDuesPage"));

export const FinanceRoutes: ProtectedRouteType[] = [
  {
    path: "/finance",
    component: <FinanceReportPage />,
    permission: "finance.read",
  },
  {
    path: "/finance/invoices",
    component: <InvoicesPage />,
    permission: "finance.read",
  },
  {
    path: "/finance/upcoming-dues",
    component: <UpcomingDuesPage />,
    permission: "finance.read",
  },
  {
    path: "/finance/service-income",
    component: <ManualInvoicesPage />,
    permission: "finance.read",
  },
  {
    path: "/finance/manual-invoices",
    component: <ManualInvoicesPage />,
    permission: "finance.read",
  },
  {
    path: "/finance/manual-invoice",
    component: <ManualInvoicePage />,
    anyPermission: [
      "course.class_students.invoice",
      "course.class_students.payment",
      "course.class_students.update",
    ],
  },
  {
    path: "/finance/receive-payment",
    component: <ReceivePaymentPage />,
    anyPermission: ["course.class_students.payment", "course.class_students.update"],
  },
];

export default FinanceRoutes;
