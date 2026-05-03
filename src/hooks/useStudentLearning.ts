import { useQueryApi } from "./common/useQueryApi";
import { RequestMethod } from "@/data/constants/methods";
import type { ApiResponse } from "@/types/api";

export interface CourseLearnSummary {
  id: number;
  title: string;
  short_description: string | null;
  long_description: string | null;
  prerequisites: string | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  language: string | null;
  level: string | null;
}

export interface CourseLearnModule {
  id: number;
  title: string;
}

export interface CourseLearnLesson {
  id: number;
  course_module_id: number;
  title: string;
  description: string | null;
  video_status: string | null;
}

export interface CourseLearnQuizFile {
  id: number;
  lesson_id: number | null;
  title: string;
  description: string | null;
  download_url: string | null;
  uploaded_at: string | null;
}

export interface CourseLearnPayload {
  course: CourseLearnSummary;
  modules: CourseLearnModule[];
  lessons: CourseLearnLesson[];
  quiz_files: CourseLearnQuizFile[];
}

export function getCourseLearnFromResponse(
  res: ApiResponse<CourseLearnPayload> | undefined,
): CourseLearnPayload | null {
  const d = res?.data as CourseLearnPayload | undefined;
  if (d && typeof d === "object" && "course" in d && "lessons" in d) {
    return d;
  }
  return null;
}

export function useCourseLearn(courseId: number | null, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && courseId != null;
  return useQueryApi<CourseLearnPayload>({
    queryKey: ["course", "learn", courseId],
    url: courseId != null ? `/courses/${courseId}/learn` : "/courses/0/learn",
    method: RequestMethod.GET,
    options: {
      enabled,
      retry: false,
    },
  });
}

export interface MyEnrollmentItem {
  id: number;
  course_id: number;
  course_title: string | null;
  course_thumbnail_url: string | null;
  plan_name: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  subscription_status: string | null;
}

export interface MyEnrollmentsPagination {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  has_more_pages: boolean;
}

export function useMyEnrollments(params?: { page?: number; per_page?: number }) {
  return useQueryApi<MyEnrollmentItem[]>({
    queryKey: ["me", "enrollments", params?.page ?? 1, params?.per_page ?? 12],
    url: "/me/enrollments",
    method: RequestMethod.GET,
    params: {
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 12,
    },
    options: {
      staleTime: 30_000,
    },
  });
}

export function getMyEnrollmentsFromResponse(
  res: ApiResponse<MyEnrollmentItem[] | { data?: MyEnrollmentItem[] }> | undefined,
): MyEnrollmentItem[] {
  if (!res?.data) return [];
  const d = res.data as unknown;
  if (Array.isArray(d)) return d as MyEnrollmentItem[];
  if (d && typeof d === "object" && "data" in d && Array.isArray((d as { data: MyEnrollmentItem[] }).data)) {
    return (d as { data: MyEnrollmentItem[] }).data;
  }
  return [];
}

export function getMyEnrollmentsPagination(res: ApiResponse<unknown> | undefined): MyEnrollmentsPagination | null {
  const meta = res?.meta as { pagination?: MyEnrollmentsPagination } | undefined;
  return meta?.pagination ?? null;
}
