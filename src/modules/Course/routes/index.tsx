import { lazy } from "react";
import { ProtectedRouteType } from "@/types/routes";

const CourseHub = lazy(() => import("../features/CourseHub/CourseHub"));
const CourseEntityList = lazy(() => import("../features/CourseEntityList/CourseEntityList"));

const courseAnyPermissions = [
      "course.main_categories.read",
      "course.sub_categories.read",
      "course.faasl_modules.read",
      "course.courses.read",
      "course.lessons.read",
      "course.assignments.read",
      "course.resources.read",
      "course.quiz_files.read",
      "course.discounts.read",
      "course.certificates.read",
      "course.subscription_plans.read",
      "course.subscriptions.read",
      "course.student_subscriptions.read",
      "course.instructors.read",
      "course.lms_classes.read",
      "course.class_students.read",
];

export const CourseModuleRoutes: ProtectedRouteType[] = [
  {
    path: "/course/entities/:slug",
    component: <CourseEntityList />,
    permission: "course.main_categories.read",
    anyPermission: courseAnyPermissions,
  },
  {
    path: "/course",
    component: <CourseHub />,
    permission: "course.main_categories.read",
    anyPermission: courseAnyPermissions,
  },
];

export default CourseModuleRoutes;
