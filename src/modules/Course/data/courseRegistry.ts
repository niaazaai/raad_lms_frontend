export type CourseEntitySlug =
  | "main-categories"
  | "sub-categories"
  | "course-faasls"
  | "courses"
  | "lessons"
  | "assignments"
  | "downloadable-resources"
  | "quiz-files"
  | "mock-tests"
  | "subscription-plans"
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
    columns: ["id", "title", "language", "level", "status", "created_at"],
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
  "mock-tests": {
    slug: "mock-tests",
    title: "Mock tests",
    pageDescription:
      "Upload mock test PDFs learners can download and practice with—keep exam prep tied to each course.",
    apiPath: "/mock-tests",
    permission: "course.mock_tests.read",
    columns: ["id", "course_id", "title", "status", "uploaded_at"],
    filterParams: ["course_id"],
  },
  "subscription-plans": {
    slug: "subscription-plans",
    title: "Subscription plans",
    pageDescription:
      "Reusable billing templates—name, describe, and price plans, then attach up to three to each course from the course wizard.",
    apiPath: "/subscription-plans",
    permission: "course.subscription_plans.read",
    columns: ["id", "plan_name", "price", "duration_in_days", "subscription_type", "status"],
  },
  "student-subscriptions": {
    slug: "student-subscriptions",
    title: "Student subscriptions",
    pageDescription:
      "Learner entitlements with dates, payment proof, and plan linkage—your ledger for who can access what.",
    apiPath: "/student-subscriptions",
    permission: "course.student_subscriptions.read",
    columns: [
      "subscription_public_id",
      "course_title",
      "user_name",
      "plan_name",
      "subscription_status",
      "purchase_date",
    ],
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
    columns: [
      "class_code",
      "main_category_name",
      "sub_category_name",
      "name",
      "instructor_name",
      "students_count",
      "class_type",
      "schedule_days",
      "class_fee",
      "schedule_date",
      "schedule_time",
    ],
  },
  "lms-class-students": {
    slug: "lms-class-students",
    title: "Students",
    pageDescription:
      "Independent student profiles—register learners once, then enroll them in classes from the class management page.",
    apiPath: "/students",
    permission: "course.class_students.read",
    columns: ["student_code", "full_name", "father_name", "user_name", "phone_number", "email", "success_story", "status"],
  },
};

export const COURSE_ENTITY_SLUGS = Object.keys(COURSE_ENTITY_REGISTRY) as CourseEntitySlug[];
