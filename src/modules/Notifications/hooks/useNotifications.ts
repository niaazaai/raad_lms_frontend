import { useQueryApi, useMutationApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { NOTIFICATION_ENDPOINTS, NOTIFICATION_QUERY_KEYS } from "../data/constants/endpoints";

export interface Notification {
  id: string;
  type: string;
  data: {
    title?: string;
    message?: string;
    type?: string;
    action_url?: string;
    [key: string]: unknown;
  };
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  data: Notification[];
  meta?: { pagination?: Record<string, number> };
  links?: Record<string, string | null>;
}

export function useNotifications(params?: { per_page?: number; page?: number }) {
  return useQueryApi<NotificationListResponse>({
    queryKey: [...NOTIFICATION_QUERY_KEYS.notifications, params],
    url: NOTIFICATION_ENDPOINTS.BASE,
    method: RequestMethod.GET,
    params: params,
  });
}

export function useUnreadNotificationCount(enabled = true) {
  return useQueryApi<{ data: { count: number } }>({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    url: NOTIFICATION_ENDPOINTS.UNREAD_COUNT,
    method: RequestMethod.GET,
    options: { enabled },
  });
}

export function useMarkAllNotificationsRead() {
  return useMutationApi<unknown, void>({
    url: NOTIFICATION_ENDPOINTS.MARK_ALL_READ,
    method: RequestMethod.POST,
    invalidateKeys: [NOTIFICATION_QUERY_KEYS.notifications, NOTIFICATION_QUERY_KEYS.unreadCount],
  });
}
