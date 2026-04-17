import type { CourseEntitySlug } from "../courseRegistry";

export const courseQueryKeys = {
  entity: (slug: CourseEntitySlug, params?: Record<string, unknown>) =>
    ["course", "entity", slug, params ?? {}] as const,
};
