import { useQueryClient } from "@tanstack/react-query";
import { useMutationApi, useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { ApiResponse } from "@/types";
import type { DataTablePaginationMeta } from "@/types/datatable";

export type AttendanceMarkStatus = "present" | "absent" | "leave";

export function nextAttendanceStatus(current: string | null | undefined): AttendanceMarkStatus {
  if (current === "present") return "absent";
  if (current === "absent") return "leave";
  return "present";
}

export interface AttendanceDateCol {
  date: string;
  day: number;
  weekday?: string;
  month: string;
  month_key: string;
  week_key?: string;
  is_friday: boolean;
  is_past: boolean;
  is_today: boolean;
  is_future: boolean;
  week_separator?: boolean;
  editable: boolean;
}

export interface AttendanceCell {
  status: string | null;
  display: string;
  editable: boolean;
}

export interface AttendanceStudentRow {
  enrollment_id: number;
  student_id: number;
  student_code?: string;
  full_name?: string;
  father_name?: string | null;
  attendance: Record<string, AttendanceCell>;
  total_present: number;
  total_absent: number;
  total_leave?: number;
}

export interface AttendanceGrid {
  class: {
    id: number;
    name?: string;
    class_code?: string;
    status?: string | null;
    can_edit?: boolean;
    schedule_days?: string | null;
    schedule_days_label?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  };
  dates: AttendanceDateCol[];
  students: AttendanceStudentRow[];
}

export interface AttendanceOverviewClass {
  id: number;
  class_code?: string | null;
  name: string;
  main_category_name?: string | null;
  sub_category_name?: string | null;
  instructor_name?: string | null;
  students_count?: number | null;
  present_rate?: number | null;
  absent_rate?: number | null;
  leave_rate?: number | null;
  schedule_days?: string | null;
  status?: string;
}

type MarkAttendanceVars = {
  student_id: number;
  date: string;
  status: AttendanceMarkStatus;
};

type AttendanceCacheSnapshot = Array<[unknown, unknown]>;

export const classAttendanceQueryKey = (classId: number) =>
  ["lms-classes", classId, "attendance"] as const;

export const attendanceOverviewQueryKey = ["lms-classes", "attendance-overview"] as const;

export function useClassAttendance(classId: number) {
  return useQueryApi<AttendanceGrid>({
    queryKey: classAttendanceQueryKey(classId),
    url: `/lms-classes/${classId}/attendance`,
    method: RequestMethod.GET,
    options: { enabled: classId > 0 },
  });
}

export function useAttendanceOverview(params?: Record<string, unknown>) {
  return useQueryApi<AttendanceOverviewClass[]>({
    queryKey: [...attendanceOverviewQueryKey, params],
    url: "/lms-classes/attendance-overview",
    method: RequestMethod.GET,
    params,
  });
}

function letterFor(status: AttendanceMarkStatus): string {
  if (status === "present") return "P";
  if (status === "leave") return "L";
  return "A";
}

function applyOptimisticMark(
  response: ApiResponse<AttendanceGrid> | undefined,
  vars: MarkAttendanceVars
): ApiResponse<AttendanceGrid> | undefined {
  if (!response?.data?.students) return response;

  const students = response.data.students.map((student) => {
    if (student.student_id !== vars.student_id) return student;

    const prev = student.attendance[vars.date];
    const prevStatus = prev?.status ?? null;
    if (prevStatus === vars.status) return student;

    let total_present = student.total_present;
    let total_absent = student.total_absent;
    let total_leave = student.total_leave ?? 0;

    if (prevStatus === "present") total_present = Math.max(0, total_present - 1);
    if (prevStatus === "absent") total_absent = Math.max(0, total_absent - 1);
    if (prevStatus === "leave") total_leave = Math.max(0, total_leave - 1);
    if (vars.status === "present") total_present += 1;
    if (vars.status === "absent") total_absent += 1;
    if (vars.status === "leave") total_leave += 1;

    return {
      ...student,
      total_present,
      total_absent,
      total_leave,
      attendance: {
        ...student.attendance,
        [vars.date]: {
          status: vars.status,
          display: letterFor(vars.status),
          editable: prev?.editable ?? true,
        },
      },
    };
  });

  return {
    ...response,
    data: {
      ...response.data,
      students,
    },
  };
}

/**
 * Instant cell UX: optimistic cache update, no full-grid refetch on every click.
 */
export function useMarkClassAttendance(classId: number) {
  const queryClient = useQueryClient();
  const queryKey = classAttendanceQueryKey(classId);

  return useMutationApi<unknown, MarkAttendanceVars>({
    url: `/lms-classes/${classId}/attendance`,
    method: RequestMethod.POST,
    invalidateKeys: [],
    options: {
      onMutate: async (vars) => {
        await queryClient.cancelQueries({ queryKey });

        const previous = queryClient.getQueriesData<ApiResponse<AttendanceGrid>>({
          queryKey,
        }) as AttendanceCacheSnapshot;

        queryClient.setQueriesData<ApiResponse<AttendanceGrid>>({ queryKey }, (old) =>
          applyOptimisticMark(old, vars)
        );

        return { previous };
      },
      onError: (_err, _vars, context) => {
        const snapshot = (context as { previous?: AttendanceCacheSnapshot } | undefined)
          ?.previous;
        snapshot?.forEach(([key, data]) => {
          queryClient.setQueryData(key as ReturnType<typeof classAttendanceQueryKey>, data);
        });
      },
    },
  });
}

export function extractAttendanceGrid(response: unknown): AttendanceGrid | null {
  if (!response || typeof response !== "object") return null;
  const data = (response as { data?: AttendanceGrid }).data;
  if (!data || typeof data !== "object") return null;
  return data;
}

export function extractAttendanceOverview(response: unknown): AttendanceOverviewClass[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: unknown }).data;
  if (Array.isArray(data)) return data as AttendanceOverviewClass[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: AttendanceOverviewClass[] }).data;
  }
  return [];
}

export function extractAttendanceOverviewPagination(
  response: unknown
): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta?.pagination ?? null;
}
