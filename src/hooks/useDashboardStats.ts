import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";

export interface DashboardStats {
  active_users_count?: number;
  total_users_count?: number;
}

export function useDashboardStats() {
  return useQueryApi<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    url: "/dashboard/stats",
    method: RequestMethod.GET,
    options: {
      staleTime: 60 * 1000,
    },
  });
}
