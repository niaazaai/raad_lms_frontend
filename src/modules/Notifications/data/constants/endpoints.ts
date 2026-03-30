export const NOTIFICATION_ENDPOINTS = {
  BASE: "/notifications",
  UNREAD_COUNT: "/notifications/unread-count",
  MARK_READ: (id: string) => `/notifications/${id}/read`,
  MARK_ALL_READ: "/notifications/read-all",
} as const;

export const NOTIFICATION_QUERY_KEYS = {
  notifications: ["notifications"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};
