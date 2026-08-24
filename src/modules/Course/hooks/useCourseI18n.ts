import { useCallback } from "react";
import type { CourseEntitySlug } from "../data/courseRegistry";
import { useTranslation, type TranslationKey } from "@/i18n/useTranslation";

const SLUG_ENTITY_KEY: Record<CourseEntitySlug, keyof typeof ENTITY_KEYS> = {
  "main-categories": "mainCategories",
  "sub-categories": "subCategories",
  "course-faasls": "courseFaasls",
  courses: "courses",
  lessons: "lessons",
  assignments: "assignments",
  "downloadable-resources": "downloadableResources",
  "quiz-files": "quizFiles",
  "mock-tests": "mockTests",
  "subscription-plans": "subscriptionPlans",
  "student-subscriptions": "studentSubscriptions",
  instructors: "instructors",
  "lms-classes": "lmsClasses",
  "lms-class-students": "lmsClassStudents",
};

const ENTITY_KEYS = {
  mainCategories: true,
  subCategories: true,
  courseFaasls: true,
  courses: true,
  lessons: true,
  assignments: true,
  downloadableResources: true,
  quizFiles: true,
  mockTests: true,
  subscriptionPlans: true,
  studentSubscriptions: true,
  instructors: true,
  lmsClasses: true,
  lmsClassStudents: true,
} as const;

type EntityKey = keyof typeof ENTITY_KEYS;

function entityPath(entityKey: EntityKey, field: "title" | "description"): TranslationKey {
  return `course.entities.${entityKey}.${field}` as TranslationKey;
}

const COLUMN_KEYS = new Set([
  "id",
  "title",
  "status",
  "main_category_name",
  "user_name",
  "course_title",
  "plan_name",
  "subscription_public_id",
  "schedule_date",
  "schedule_time",
  "class_code",
  "sub_category_name",
  "schedule_days",
  "name",
  "course_name",
  "instructor_name",
  "class_type",
  "class_fee",
  "student_code",
  "first_name",
  "father_name",
  "phone_number",
  "email",
  "specialization",
  "bio",
  "language",
  "level",
  "price",
  "created_at",
  "updated_at",
  "uploaded_at",
  "course_id",
  "lesson_id",
  "content_type",
  "subscription_status",
  "purchase_date",
  "duration_in_days",
  "subscription_type",
  "full_name",
  "grade",
  "success_story",
  "payment_status",
  "due_amount",
  "marks",
  "discount_percent",
  "fee_amount",
  "paid_amount",
  "students_count",
]);

export function useCourseI18n() {
  const { t } = useTranslation();

  const entityTitle = useCallback(
    (slug: CourseEntitySlug) => t(entityPath(SLUG_ENTITY_KEY[slug], "title")),
    [t],
  );

  const entityDescription = useCallback(
    (slug: CourseEntitySlug) => t(entityPath(SLUG_ENTITY_KEY[slug], "description")),
    [t],
  );

  const columnHeader = useCallback(
    (key: string, slug?: CourseEntitySlug) => {
      if (key === "main_category_name") return t("course.columns.main_category_name");
      if (key === "user_name") {
        return slug === "student-subscriptions"
          ? t("course.columns.student")
          : t("course.columns.user_name");
      }
      if (key === "thumbnail" || key === "image") return t("course.columns.image");
      if (COLUMN_KEYS.has(key)) return t(`course.columns.${key}` as TranslationKey);
      return key.replace(/_/g, " ");
    },
    [t],
  );

  const drawerHeading = useCallback(
    (mode: "create" | "edit" | "view", slug: CourseEntitySlug) => {
      const entity = entityTitle(slug);
      const modeKey =
        mode === "create" ? "course.drawer.create" : mode === "edit" ? "course.drawer.edit" : "course.drawer.view";
      return t(modeKey as TranslationKey).replace("{entity}", entity);
    },
    [t, entityTitle],
  );

  return { entityTitle, entityDescription, columnHeader, drawerHeading, t };
}
