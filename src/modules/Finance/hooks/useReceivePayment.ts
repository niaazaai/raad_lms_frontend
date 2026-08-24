import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { ClassStudentRow } from "@/modules/Course/hooks/useClassStudents";
import { extractClassStudentsFromResponse } from "@/modules/Course/hooks/useClassStudents";
import { FINANCE_ENDPOINTS, FINANCE_QUERY_KEYS } from "../data/constants/endpoints";

export function useStudentActiveEnrollments(studentId: number | null) {
  return useQueryApi<ClassStudentRow[]>({
    queryKey: [...FINANCE_QUERY_KEYS.studentEnrollments, studentId],
    url: FINANCE_ENDPOINTS.STUDENT_ENROLLMENTS(studentId ?? 0),
    method: RequestMethod.GET,
    options: { enabled: studentId != null && studentId > 0 },
  });
}

export function extractStudentEnrollments(response: unknown): ClassStudentRow[] {
  return extractClassStudentsFromResponse(response);
}
