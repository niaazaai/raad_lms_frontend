/**
 * Theme mode options
 */
export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark",
  SYSTEM = "system",
}

/**
 * User status (active / inactive only)
 */
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

/**
 * Toast notification types
 */
export enum ToastType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

/**
 * Authentication status
 */
export enum AuthStatus {
  IDLE = "idle",
  LOADING = "loading",
  AUTHENTICATED = "authenticated",
  UNAUTHENTICATED = "unauthenticated",
  FAILED = "failed",
}
