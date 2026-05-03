import { useQueryApi } from "./common/useQueryApi";
import { RequestMethod } from "@/data/constants/methods";
import type { ApiResponse } from "@/types/api";

export interface PublicCourseListItem {
  id: number;
  title: string;
  short_description: string | null;
  level: string | null;
  language: string | null;
  price: string | null;
  is_free: boolean;
  estimated_duration: string | number | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  thumbnail_url: string | null;
  banner_url: string | null;
}

export const PUBLIC_COURSES_QUERY_KEY = ["public", "courses"] as const;

export interface PublicCoursesPagination {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  has_more_pages: boolean;
}

export interface PublicCourseDetailModule {
  id: number;
  title: string;
}

export interface PublicCourseDetailLesson {
  id: number;
  course_module_id: number;
  title: string;
  description: string | null;
  video_status: string | null;
}

export interface PublicSubscriptionPlan {
  id: number;
  plan_name: string;
  plan_description: string | null;
  price: string;
  duration_in_days: number;
  subscription_type: string;
}

export interface PublicCategoryRef {
  id: number;
  title: string;
}

export interface PublicInstructorRef {
  id: number;
  name: string;
}

export interface PublicCourseDetail extends PublicCourseListItem {
  long_description: string | null;
  prerequisites: string | null;
  is_featured: boolean;
  is_popular: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  main_category?: PublicCategoryRef | null;
  sub_category?: PublicCategoryRef | null;
  instructor?: PublicInstructorRef | null;
  preview_lesson_id?: number | null;
  subscription_plans?: PublicSubscriptionPlan[];
  modules: PublicCourseDetailModule[];
  lessons: PublicCourseDetailLesson[];
}

export function usePublicCourseDetail(courseId: number | null, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && courseId != null;
  return useQueryApi<PublicCourseDetail | { data?: PublicCourseDetail }>({
    queryKey: [...PUBLIC_COURSES_QUERY_KEY, "detail", courseId],
    url: courseId != null ? `/public/courses/${courseId}` : "/public/courses/0",
    method: RequestMethod.GET,
    options: {
      enabled,
      staleTime: 60_000,
    },
  });
}

export function getPublicCourseDetailFromResponse(
  res: ApiResponse<PublicCourseDetail | { data?: PublicCourseDetail }> | undefined,
): PublicCourseDetail | null {
  if (!res?.data) return null;
  const d = res.data;
  if (d && typeof d === "object" && !Array.isArray(d) && "modules" in d && "lessons" in d) {
    return d as PublicCourseDetail;
  }
  if (d && typeof d === "object" && "data" in d) {
    const inner = (d as { data?: PublicCourseDetail }).data;
    if (inner && typeof inner === "object" && "modules" in inner) {
      return inner;
    }
  }
  return null;
}

export function usePublicCoursePreviewPlayback(courseId: number | null, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && courseId != null;
  return useQueryApi<PreviewPlaybackPayload>({
    queryKey: [...PUBLIC_COURSES_QUERY_KEY, "preview-playback", courseId],
    url: courseId != null ? `/public/courses/${courseId}/preview-playback` : "/public/courses/0/preview-playback",
    method: RequestMethod.GET,
    options: {
      enabled,
      staleTime: 60_000,
    },
  });
}

export interface PreviewPlaybackPayload {
  lesson_id: number | null;
  type: "hls" | "progressive";
  src: string;
  qualities?: { label: string; src: string }[] | null;
}

export function getPreviewPlaybackFromResponse(
  res: ApiResponse<PreviewPlaybackPayload> | undefined,
): PreviewPlaybackPayload | null {
  const d = res?.data as PreviewPlaybackPayload | undefined;
  if (!d || typeof d !== "object") return null;
  if (!("src" in d)) return null;
  return d;
}

export function usePublicCourses(params: { page?: number; per_page?: number }) {
  return useQueryApi<PublicCourseListItem[] | { data?: PublicCourseListItem[] }>({
    queryKey: [...PUBLIC_COURSES_QUERY_KEY, params],
    url: "/public/courses",
    method: RequestMethod.GET,
    params: {
      page: params.page ?? 1,
      per_page: params.per_page ?? 12,
    },
    options: {
      staleTime: 60_000,
    },
  });
}

export function getPublicCoursesFromResponse(
  res: ApiResponse<PublicCourseListItem[] | { data?: PublicCourseListItem[] }> | undefined,
): PublicCourseListItem[] {
  if (!res?.data) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object" && "data" in d && Array.isArray((d as { data: PublicCourseListItem[] }).data)) {
    return (d as { data: PublicCourseListItem[] }).data;
  }
  return [];
}

/** Accepts the same response shape as {@link usePublicCourses} (flat or Laravel Resource-wrapped `data`). */
export function getPublicCoursesPagination(
  res: ApiResponse<PublicCourseListItem[] | { data?: PublicCourseListItem[] }> | undefined,
): PublicCoursesPagination | null {
  const meta = res?.meta as { pagination?: PublicCoursesPagination } | undefined;
  return meta?.pagination ?? null;
}
