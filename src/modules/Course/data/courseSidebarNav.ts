import { COURSE_ENTITY_REGISTRY, type CourseEntitySlug } from "./courseRegistry";

/** Every course read permission — used for hub + sidebar group visibility. */
export const COURSE_MODULE_ANY_PERMISSIONS: string[] = (
  Object.keys(COURSE_ENTITY_REGISTRY) as CourseEntitySlug[]
).map((slug) => COURSE_ENTITY_REGISTRY[slug].permission);

/**
 * Ordered slugs for the course sidebar (workflow order). Section headings like
 * "Catalog & courses" are intentionally omitted for a cleaner nav.
 */
export const COURSE_SIDEBAR_ORDER: CourseEntitySlug[] = [
  "main-categories",
  "sub-categories",
  "courses",
  "student-discounts",
  "subscription-plans",
  "student-subscriptions",
  "lms-classes",
  "lms-class-students",
];

export type CourseSidebarRow = { kind: "overview" } | { kind: "entity"; slug: CourseEntitySlug };

export function buildCourseSidebarRows(
  hasPermission: (permission: string) => boolean
): CourseSidebarRow[] {
  const rows: CourseSidebarRow[] = [{ kind: "overview" }];

  for (const slug of COURSE_SIDEBAR_ORDER) {
    if (!hasPermission(COURSE_ENTITY_REGISTRY[slug].permission)) continue;
    rows.push({ kind: "entity", slug });
  }

  return rows;
}
