import { COURSE_ENTITY_REGISTRY, type CourseEntitySlug } from "./courseRegistry";

/** Every course read permission — used for hub + sidebar group visibility. */
export const COURSE_MODULE_ANY_PERMISSIONS: string[] = (
  Object.keys(COURSE_ENTITY_REGISTRY) as CourseEntitySlug[]
).map((slug) => COURSE_ENTITY_REGISTRY[slug].permission);

/**
 * Groups for the admin sidebar: catalog → content → monetization → credentials → delivery.
 * Order matches a typical admin workflow.
 */
export const COURSE_SIDEBAR_GROUPS: { title: string; slugs: CourseEntitySlug[] }[] = [
  {
    title: "Catalog & courses",
    slugs: ["main-categories", "sub-categories", "course-faasls", "courses"],
  },
  {
    title: "Course content",
    slugs: ["lessons", "assignments", "downloadable-resources", "quiz-files"],
  },
  {
    title: "Pricing & access",
    slugs: ["student-discounts", "subscription-plans", "course-subscriptions", "student-subscriptions"],
  },
  {
    title: "Certificates",
    slugs: ["certificates"],
  },
  {
    title: "Instructors & classes",
    slugs: ["instructors", "lms-classes", "lms-class-students"],
  },
];

export type CourseSidebarRow =
  | { kind: "overview" }
  | { kind: "section"; title: string }
  | { kind: "entity"; slug: CourseEntitySlug };

export function buildCourseSidebarRows(
  hasPermission: (permission: string) => boolean
): CourseSidebarRow[] {
  const rows: CourseSidebarRow[] = [{ kind: "overview" }];

  for (const group of COURSE_SIDEBAR_GROUPS) {
    const visibleSlugs = group.slugs.filter((slug) =>
      hasPermission(COURSE_ENTITY_REGISTRY[slug].permission)
    );
    if (visibleSlugs.length === 0) continue;

    rows.push({ kind: "section", title: group.title });
    for (const slug of visibleSlugs) {
      rows.push({ kind: "entity", slug });
    }
  }

  return rows;
}
