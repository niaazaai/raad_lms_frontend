export const FINANCE_ENDPOINTS = {
  REPORT: "/finance/report",
  INVOICES: "/finance/invoices",
  UPCOMING_INSTALLMENTS: "/finance/upcoming-installments",
  MANUAL_INVOICES: "/finance/manual-invoices",
  MANUAL_INVOICE_NEXT_NUMBER: "/finance/next-invoice-number",
  STUDENT_ENROLLMENTS: (studentId: number) => `/finance/students/${studentId}/enrollments`,
  ENROLLMENT_TRANSACTIONS: (enrollmentId: number) =>
    `/finance/enrollments/${enrollmentId}/transactions`,
} as const;

export const FINANCE_QUERY_KEYS = {
  report: ["finance", "report"] as const,
  invoices: ["finance", "invoices"] as const,
  manualInvoices: ["finance", "service-income"] as const,
  upcomingInstallments: ["finance", "upcoming-installments"] as const,
  studentEnrollments: ["finance", "student-enrollments"] as const,
  enrollmentTransactions: (enrollmentId: number) =>
    ["finance", "enrollment-transactions", enrollmentId] as const,
} as const;
