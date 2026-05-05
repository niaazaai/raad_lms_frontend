import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { callApi } from "@/services";
import type { CourseEntitySlug } from "../data/courseRegistry";
import { COURSE_ENTITY_REGISTRY } from "../data/courseRegistry";
import { courseQueryKeys } from "../data/constants/queryKeys";

export type CourseRow = Record<string, unknown>;

function getRowsFromResponse(response: unknown): CourseRow[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: CourseRow[] | { data?: CourseRow[] } }).data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { data?: CourseRow[] }).data)) {
    return (data as { data: CourseRow[] }).data;
  }
  return [];
}

export function getCourseListFromResponse(response: unknown): CourseRow[] {
  return getRowsFromResponse(response);
}

export function getCourseEntityDetailFromResponse(response: unknown): CourseRow | null {
  if (!response || typeof response !== "object") return null;
  const data = (response as { data?: unknown }).data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as CourseRow;
  }
  return null;
}

export function useCourseEntityList(
  slug: CourseEntitySlug | null,
  params?: Record<string, unknown>,
  options?: { enabled?: boolean }
) {
  const effectiveSlug = slug ?? "main-categories";
  const cfg = COURSE_ENTITY_REGISTRY[effectiveSlug];
  return useQueryApi<CourseRow[]>({
    queryKey: courseQueryKeys.entity(effectiveSlug, params),
    url: cfg.apiPath,
    method: RequestMethod.GET,
    params,
    options: {
      enabled: options?.enabled !== false && slug !== null,
    },
  });
}

export function useDeleteCourseEntity(slug: CourseEntitySlug) {
  const queryClient = useQueryClient();
  const cfg = COURSE_ENTITY_REGISTRY[slug];

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await callApi({
        url: `${cfg.apiPath}/${id}`,
        method: RequestMethod.DELETE,
        shouldPopError: false,
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Delete failed");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", "entity", slug] });
      if (slug === "main-categories") {
        queryClient.invalidateQueries({ queryKey: ["course", "form-meta"] });
      }
    },
  });
}

export function useCourseEntityDetail(
  slug: CourseEntitySlug,
  id: number | null,
  options?: { enabled?: boolean }
) {
  const cfg = COURSE_ENTITY_REGISTRY[slug];
  return useQueryApi<CourseRow>({
    queryKey: ["course", "entity", slug, "detail", id],
    url: `${cfg.apiPath}/${id ?? 0}`,
    method: RequestMethod.GET,
    options: {
      enabled: options?.enabled !== false && id != null,
    },
  });
}

export function useCreateCourseEntity(slug: CourseEntitySlug) {
  const queryClient = useQueryClient();
  const cfg = COURSE_ENTITY_REGISTRY[slug];

  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const hasFiles = Object.values(body).some((v) => v instanceof File);
      const response = await callApi<CourseRow>({
        url: cfg.apiPath,
        method: RequestMethod.POST,
        data: body,
        shouldPopError: false,
        hasFiles,
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Create failed");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", "entity", slug] });
      if (slug === "main-categories") {
        queryClient.invalidateQueries({ queryKey: ["course", "form-meta"] });
      }
    },
  });
}

export function useUpdateCourseEntity(slug: CourseEntitySlug) {
  const queryClient = useQueryClient();
  const cfg = COURSE_ENTITY_REGISTRY[slug];

  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Record<string, unknown> }) => {
      const hasFiles = Object.values(body).some((v) => v instanceof File);
      const response = await callApi<CourseRow>({
        url: `${cfg.apiPath}/${id}`,
        method: RequestMethod.PATCH,
        data: body,
        shouldPopError: false,
        hasFiles,
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Update failed");
      }
      return response.data;
    },
    onSuccess: (_data: unknown, vars: { id: number; body: Record<string, unknown> }) => {
      queryClient.invalidateQueries({ queryKey: ["course", "entity", slug] });
      queryClient.invalidateQueries({ queryKey: ["course", "entity", slug, "detail", vars.id] });
      if (slug === "main-categories") {
        queryClient.invalidateQueries({ queryKey: ["course", "form-meta"] });
      }
    },
  });
}

/** Approve a pending student subscription (active + paid, discount applied on server, student notified). */
export function useApproveStudentSubscription() {
  const queryClient = useQueryClient();
  const slug: CourseEntitySlug = "student-subscriptions";
  const cfg = COURSE_ENTITY_REGISTRY[slug];

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await callApi<CourseRow>({
        url: `${cfg.apiPath}/${id}/approve`,
        method: RequestMethod.POST,
        shouldPopError: false,
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Approval failed");
      }
      return response.data;
    },
    onSuccess: (_data: unknown, id: number) => {
      queryClient.invalidateQueries({ queryKey: ["course", "entity", slug] });
      queryClient.invalidateQueries({ queryKey: ["course", "entity", slug, "detail", id] });
    },
  });
}
