import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { ACTIVITY_LOG_ENDPOINTS, ACTIVITY_LOG_QUERY_KEYS } from "../data/constants/endpoints";

import type { UserActivityLogEntry } from "../data/models/activityLog";

/**
 * Paginated activity log index (requires `root` role on backend).
 */
export function useActivityLogs(params?: Record<string, unknown>) {
  return useQueryApi<UserActivityLogEntry[]>({
    queryKey: [...ACTIVITY_LOG_QUERY_KEYS.list, params],
    url: ACTIVITY_LOG_ENDPOINTS.BASE,
    method: RequestMethod.GET,
    params,
  });
}
