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
export { useDashboardStats } from "./useDashboardStats";
export type { DashboardStats } from "./useDashboardStats";
