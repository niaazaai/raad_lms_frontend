export type CourseEntitySlug =
  | "main-categories"
  | "sub-categories"
  | "course-faasls"
  | "courses"
  | "lessons"
  | "assignments"
  | "downloadable-resources"
  | "quiz-files"
  | "student-discounts"
  | "certificates"
  | "subscription-plans"
  | "course-subscriptions"
  | "student-subscriptions"
  | "instructors"
  | "lms-classes"
  | "lms-class-students";

export interface CourseEntityConfig {
  slug: CourseEntitySlug;
  title: string;
  apiPath: string;
  permission: string;
  /** DataTable column keys (from API row objects). */
  columns: string[];
  /** Extra query params to help list screens (e.g. filter by course). */
  filterParams?: string[];
}

export const COURSE_ENTITY_REGISTRY: Record<CourseEntitySlug, CourseEntityConfig> = {
  "main-categories": {
    slug: "main-categories",
    title: "Course main categories",
    apiPath: "/main-categories",
    permission: "course.main_categories.read",
    columns: ["id", "title", "status", "created_at"],
  },
  "sub-categories": {
    slug: "sub-categories",
    title: "Course sub categories",
    apiPath: "/sub-categories",
    permission: "course.sub_categories.read",
    columns: ["id", "main_category_id", "title", "status", "created_at"],
  },
  "course-faasls": {
    slug: "course-faasls",
    title: "Course modules (faasl)",
    apiPath: "/course-faasls",
    permission: "course.faasl_modules.read",
    columns: ["id", "title", "created_at"],
  },
  courses: {
    slug: "courses",
    title: "Courses",
    apiPath: "/courses",
    permission: "course.courses.read",
    columns: ["id", "title", "language", "level", "status", "price", "created_at"],
    filterParams: ["course_main_category_id", "course_sub_category_id", "course_module_id"],
  },
  lessons: {
    slug: "lessons",
    title: "Course lessons",
    apiPath: "/lessons",
    permission: "course.lessons.read",
    columns: ["id", "course_id", "title", "content_type", "created_at"],
    filterParams: ["course_id"],
  },
  assignments: {
    slug: "assignments",
    title: "Assignments",
    apiPath: "/assignments",
    permission: "course.assignments.read",
    columns: ["id", "course_id", "lesson_id", "title", "status", "created_at"],
    filterParams: ["course_id"],
  },
  "downloadable-resources": {
    slug: "downloadable-resources",
    title: "Downloadable resources",
    apiPath: "/downloadable-resources",
    permission: "course.resources.read",
    columns: ["id", "course_id", "lesson_id", "title", "status", "uploaded_at"],
    filterParams: ["course_id"],
  },
  "quiz-files": {
    slug: "quiz-files",
    title: "Quiz files",
    apiPath: "/quiz-files",
    permission: "course.quiz_files.read",
    columns: ["id", "course_id", "lesson_id", "title", "status", "uploaded_at"],
    filterParams: ["course_id"],
  },
  "student-discounts": {
    slug: "student-discounts",
    title: "Student discounts",
    apiPath: "/student-discounts",
    permission: "course.discounts.read",
    columns: ["id", "course_id", "user_id", "discount_type", "discount_status", "created_at"],
    filterParams: ["course_id"],
  },
  certificates: {
    slug: "certificates",
    title: "Certificates",
    apiPath: "/certificates",
    permission: "course.certificates.read",
    columns: ["id", "course_id", "user_id", "status", "issue_date", "certificate_public_id"],
    filterParams: ["course_id"],
  },
  "subscription-plans": {
    slug: "subscription-plans",
    title: "Subscription plans",
    apiPath: "/subscription-plans",
    permission: "course.subscription_plans.read",
    columns: ["id", "course_id", "plan_name", "price", "duration_in_days", "subscription_type", "status"],
    filterParams: ["course_id"],
  },
  "course-subscriptions": {
    slug: "course-subscriptions",
    title: "Course subscriptions",
    apiPath: "/course-subscriptions",
    permission: "course.subscriptions.read",
    columns: ["id", "course_id", "plan_id", "subscription_status", "created_at"],
    filterParams: ["course_id"],
  },
  "student-subscriptions": {
    slug: "student-subscriptions",
    title: "Student subscriptions",
    apiPath: "/student-subscriptions",
    permission: "course.student_subscriptions.read",
    columns: ["id", "course_id", "user_id", "subscription_status", "payment_status", "purchase_date"],
    filterParams: ["course_id"],
  },
  instructors: {
    slug: "instructors",
    title: "Instructors",
    apiPath: "/instructors",
    permission: "course.instructors.read",
    columns: ["id", "user_id", "specialization", "status", "created_at"],
  },
  "lms-classes": {
    slug: "lms-classes",
    title: "Classes",
    apiPath: "/lms-classes",
    permission: "course.lms_classes.read",
    columns: ["id", "name", "course_id", "instructor_id", "class_type", "status", "start_date"],
    filterParams: ["course_id"],
  },
  "lms-class-students": {
    slug: "lms-class-students",
    title: "Class students",
    apiPath: "/lms-class-students",
    permission: "course.class_students.read",
    columns: ["id", "class_id", "user_id", "status", "grade", "enrollment_date"],
    filterParams: ["class_id"],
  },
};

export const COURSE_ENTITY_SLUGS = Object.keys(COURSE_ENTITY_REGISTRY) as CourseEntitySlug[];
