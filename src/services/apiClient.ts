import { create, ApisauceInstance } from "apisauce";

/**
 * API base path (same-origin). Using a relative path avoids Vite/Rollup evaluating
 * `window` at build time and baking `http://localhost:8000` into the production bundle.
 */
export const API_V1_BASE = "/api/v1";

/** Sanctum CSRF endpoint (same-origin). */
export const CSRF_COOKIE_PATH = "/sanctum/csrf-cookie";

/**
 * Absolute origin for rare cases (e.g. debugging). Prefer relative paths in the UI.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
}

const apiClient: ApisauceInstance = create({
  baseURL: API_V1_BASE,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000,
});

/** Attach the XSRF-TOKEN cookie value as a header on every request. */
apiClient.addRequestTransform((request) => {
  const xsrfToken = getCookie("XSRF-TOKEN");
  if (xsrfToken && request.headers) {
    request.headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrfToken);
  }
});

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default apiClient;
