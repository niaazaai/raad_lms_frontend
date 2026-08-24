export const FINANCE_ENDPOINTS = {
  REPORT: "/finance/report",
  STUDENT_ENROLLMENTS: (studentId: number) => `/finance/students/${studentId}/enrollments`,
} as const;

export const FINANCE_QUERY_KEYS = {
  report: ["finance", "report"] as const,
  studentEnrollments: ["finance", "student-enrollments"] as const,
};
