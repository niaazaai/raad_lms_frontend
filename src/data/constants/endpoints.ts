/**
 * API endpoint definitions (relative to /api/v1).
 * CSRF is handled by Sanctum's built-in /sanctum/csrf-cookie — not listed here.
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    REGISTER: "/auth/register",
    VERIFY_2FA: "/auth/2fa/verify",
    RESEND_2FA: "/auth/2fa/resend",
    ENABLE_2FA: "/auth/2fa/enable",
    CONFIRM_2FA: "/auth/2fa/confirm",
    DISABLE_2FA: "/auth/2fa/disable",
    EMAIL_RESEND: "/auth/email/resend",
  },

  NOTIFICATIONS: {
    BASE: "/notifications",
    UNREAD_COUNT: "/notifications/unread-count",
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: "/notifications/read-all",
  },
} as const;
