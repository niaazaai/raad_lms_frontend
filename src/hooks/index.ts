// Export all hooks from a single entry point
export {
  useQueryApi,
  useMutationApi,
  useMultiQueryApi,
  useSuspenseQueryApi,
} from "./common/useQueryApi";
export { useDataTableParams } from "./common/useDataTableParams";
export { default as useApi } from "./common/useApi";
export { useDebounce } from "./common/useDebounce";
export {
  usePublicCourses,
  getPublicCoursesFromResponse,
  getPublicCoursesPagination,
  PUBLIC_COURSES_QUERY_KEY,
  type PublicCourseListItem,
  type PublicCoursesPagination,
} from "./usePublicCourses";
export { useDashboardStats } from "./useDashboardStats";
export type { DashboardStats } from "./useDashboardStats";
