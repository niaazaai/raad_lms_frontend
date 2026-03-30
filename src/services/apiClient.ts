import { create, ApisauceInstance } from "apisauce";

/**
 * Base API URL — same-origin in the browser so production requests
 * (e.g. https://your-domain.com) never hit localhost.
 */
const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") return window.location.origin;
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
};

export const API_BASE_URL = getApiBaseUrl();

export const AUTH_BASE_URL = getApiBaseUrl();

/**
 * Sanctum's built-in CSRF cookie endpoint (relative to origin, NOT /api/v1).
 */
export const CSRF_COOKIE_URL = `${API_BASE_URL}/sanctum/csrf-cookie`;

const apiClient: ApisauceInstance = create({
  baseURL: `${API_BASE_URL}/api/v1`,
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
