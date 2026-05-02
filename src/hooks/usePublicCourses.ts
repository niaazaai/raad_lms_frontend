import { useQueryApi } from "@/hooks";
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
  estimated_duration: string | null;
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
