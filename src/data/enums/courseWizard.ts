/**
 * Course wizard enums — values align with Laravel `StoreCourseRequest` / `UpdateCourseRequest`.
 */

export const CourseLanguage = {
  PASHTOO: "PASHTOO",
  DARI: "DARI",
  ENGLISH: "ENGLISH",
} as const;

export type CourseLanguageValue = (typeof CourseLanguage)[keyof typeof CourseLanguage];

export const COURSE_LANGUAGE_OPTIONS: readonly { value: CourseLanguageValue; label: string }[] = [
  { value: CourseLanguage.PASHTOO, label: "Pashto" },
  { value: CourseLanguage.DARI, label: "Dari" },
  { value: CourseLanguage.ENGLISH, label: "English" },
];

export const CourseLevel = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
} as const;

export type CourseLevelValue = (typeof CourseLevel)[keyof typeof CourseLevel];

export const COURSE_LEVEL_OPTIONS: readonly { value: CourseLevelValue; label: string }[] = [
  { value: CourseLevel.BEGINNER, label: "Beginner" },
  { value: CourseLevel.INTERMEDIATE, label: "Intermediate" },
  { value: CourseLevel.ADVANCED, label: "Advanced" },
];
