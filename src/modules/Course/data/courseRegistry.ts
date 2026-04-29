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
  /** Short, human subtitle for list pages (replaces generic CRUD copy). */
  pageDescription: string;
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
    title: "Main categories",
    pageDescription:
      "Shape the top of your ACCA catalog—group papers and qualifications so learners find the right track fast.",
    apiPath: "/main-categories",
    permission: "course.main_categories.read",
    columns: ["id", "title", "status"],
  },
  "sub-categories": {
    slug: "sub-categories",
    title: "Sub categories",
    pageDescription:
      "Refine each main strand into skills levels, exam sessions, or bundles—keep sub-groups tight and searchable.",
    apiPath: "/sub-categories",
    permission: "course.sub_categories.read",
    columns: ["id", "main_category_name", "title", "status"],
  },
  "course-faasls": {
    slug: "course-faasls",
    title: "Modules (faasl)",
    pageDescription:
      "Modules (faasl) sequence the ACCA journey—name each stage so courses and classes stay aligned.",
    apiPath: "/faasls",
    permission: "course.faasl_modules.read",
    columns: ["id", "title", "created_at"],
  },
  courses: {
    slug: "courses",
    title: "Courses",
    pageDescription:
      "Publish ACCA-facing programs with pricing, level, and visibility—your storefront for skills and exam prep.",
    apiPath: "/courses",
    permission: "course.courses.read",
    columns: ["id", "title", "language", "level", "status", "price", "created_at"],
    filterParams: ["course_main_category_id", "course_sub_category_id", "course_module_id"],
  },
  lessons: {
    slug: "lessons",
    title: "Lessons",
    pageDescription:
      "Lessons carry video, readings, and progress signals—structure each unit for clarity and completion tracking.",
    apiPath: "/lessons",
    permission: "course.lessons.read",
    columns: ["id", "course_id", "title", "content_type", "created_at"],
    filterParams: ["course_id"],
  },
  assignments: {
    slug: "assignments",
    title: "Assignments",
    pageDescription:
      "Issue practice papers and marked tasks—tie each assignment to the right lesson and course cohort.",
    apiPath: "/assignments",
    permission: "course.assignments.read",
    columns: ["id", "course_id", "lesson_id", "title", "status", "created_at"],
    filterParams: ["course_id"],
  },
  "downloadable-resources": {
    slug: "downloadable-resources",
    title: "Downloadable resources",
    pageDescription:
      "Syllabi, PDFs, and worksheets learners can save—keep files versioned and tied to lessons when needed.",
    apiPath: "/downloadable-resources",
    permission: "course.resources.read",
    columns: ["id", "course_id", "lesson_id", "title", "status", "uploaded_at"],
    filterParams: ["course_id"],
  },
  "quiz-files": {
    slug: "quiz-files",
    title: "Quiz files",
    pageDescription:
      "Upload quiz packs and assessments—link them to lessons so tutors always assign the right document.",
    apiPath: "/quiz-files",
    permission: "course.quiz_files.read",
    columns: ["id", "course_id", "lesson_id", "title", "status", "uploaded_at"],
    filterParams: ["course_id"],
  },
  "student-discounts": {
    slug: "student-discounts",
    title: "Student discounts",
    pageDescription:
      "Reward loyal cohorts or partners—percentage or fixed reductions per learner and course, with clear status.",
    apiPath: "/student-discounts",
    permission: "course.discounts.read",
    columns: ["id", "course_id", "user_id", "discount_type", "discount_status", "created_at"],
    filterParams: ["course_id"],
  },
  certificates: {
    slug: "certificates",
    title: "Certificates",
    pageDescription:
      "Issue verifiable ACCA completion records—track public IDs, signatures, and issue dates in one place.",
    apiPath: "/certificates",
    permission: "course.certificates.read",
    columns: ["id", "course_id", "user_id", "status", "issue_date", "certificate_public_id"],
    filterParams: ["course_id"],
  },
  "subscription-plans": {
    slug: "subscription-plans",
    title: "Subscription plans",
    pageDescription:
      "Define free vs paid access windows—duration, price, and plan copy that matches your ACCA offerings.",
    apiPath: "/subscription-plans",
    permission: "course.subscription_plans.read",
    columns: [
      "id",
      "course_id",
      "plan_name",
      "price",
      "duration_in_days",
      "subscription_type",
      "status",
    ],
    filterParams: ["course_id"],
  },
  "course-subscriptions": {
    slug: "course-subscriptions",
    title: "Course subscriptions",
    pageDescription:
      "Catalog entries that pair each course with a sellable plan—control what appears in checkout flows.",
    apiPath: "/course-subscriptions",
    permission: "course.subscriptions.read",
    columns: ["id", "course_id", "plan_id", "subscription_status", "created_at"],
    filterParams: ["course_id"],
  },
  "student-subscriptions": {
    slug: "student-subscriptions",
    title: "Student subscriptions",
    pageDescription:
      "Learner entitlements with dates, payment proof, and approvals—your ledger for who can access what.",
    apiPath: "/student-subscriptions",
    permission: "course.student_subscriptions.read",
    columns: [
      "id",
      "course_id",
      "user_id",
      "subscription_status",
      "payment_status",
      "purchase_date",
    ],
    filterParams: ["course_id"],
  },
  instructors: {
    slug: "instructors",
    title: "Instructors",
    pageDescription:
      "Link ACCA tutors to user profiles—bios, specializations, and availability for class assignments.",
    apiPath: "/instructors",
    permission: "course.instructors.read",
    columns: ["id", "user_name", "specialization", "bio", "status", "created_at"],
  },
  "lms-classes": {
    slug: "lms-classes",
    title: "Classes",
    pageDescription:
      "Schedule live or on-demand cohorts—dates, instructors, and status for every ACCA class instance.",
    apiPath: "/lms-classes",
    permission: "course.lms_classes.read",
    columns: ["id", "name", "course_id", "instructor_id", "class_type", "status", "start_date"],
    filterParams: ["course_id"],
  },
  "lms-class-students": {
    slug: "lms-class-students",
    title: "Class students",
    pageDescription:
      "Roster, grades, and feedback per cohort—close the loop from enrollment to instructor sign-off.",
    apiPath: "/lms-class-students",
    permission: "course.class_students.read",
    columns: ["id", "class_id", "user_id", "status", "grade", "enrollment_date"],
    filterParams: ["class_id"],
  },
};

export const COURSE_ENTITY_SLUGS = Object.keys(COURSE_ENTITY_REGISTRY) as CourseEntitySlug[];
