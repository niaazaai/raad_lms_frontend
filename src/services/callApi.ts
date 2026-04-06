import { ApiResponse as ApisauceResponse, ApisauceConfig } from "apisauce";
import apiClient, { CSRF_COOKIE_PATH } from "./apiClient";
import { ApiResponse, ObjectAny } from "@/types";
import { RequestMethod } from "@/data/constants/methods";
import { toast } from "sonner";

type CallApiProps<R> = {
  params?: ObjectAny;
  shouldPopError?: boolean;
  hasFiles?: boolean;
  skipCsrf?: boolean;
  retryOn419?: boolean;
  tempData?: R;
} & Partial<ApisauceConfig>;

let csrfPromise: Promise<void> | null = null;

/**
 * Fetch CSRF cookie via Sanctum's built-in endpoint.
 * De-duplicates concurrent calls so only one request is in-flight at a time.
 */
export async function fetchCsrfCookie(): Promise<void> {
  if (csrfPromise) return csrfPromise;

  csrfPromise = (async () => {
    try {
      const response = await fetch(CSRF_COOKIE_PATH, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`CSRF cookie fetch failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to fetch CSRF cookie:", error);
      throw error;
    } finally {
      csrfPromise = null;
    }
  })();

  return csrfPromise;
}

/**
 * Check if the request method requires CSRF protection
 */
function requiresCsrf(method: string): boolean {
  const csrfMethods = [
    RequestMethod.POST,
    RequestMethod.PUT,
    RequestMethod.PATCH,
    RequestMethod.DELETE,
  ];
  return csrfMethods.includes(method.toUpperCase() as RequestMethod);
}

/**
 * Main API call function with Sanctum support
 *
 * Features:
 * - Automatic CSRF token handling for state-changing requests
 * - 419 (CSRF expired) retry logic
 * - Error toast notifications
 * - File upload support with FormData
 * - Full TypeScript support
 */
const callApi = async <R = ObjectAny>({
  method = RequestMethod.GET,
  data = {},
  params = {},
  headers = {},
  shouldPopError = true,
  hasFiles = false,
  skipCsrf = false,
  retryOn419 = true,
  ...props
}: CallApiProps<R>): Promise<ApisauceResponse<ApiResponse<R>, ApiResponse<R>>> => {
  // Fetch CSRF cookie before state-changing requests
  if (!skipCsrf && requiresCsrf(method)) {
    try {
      await fetchCsrfCookie();
    } catch {
      // Continue anyway - the request might still work if cookie exists
      console.warn("CSRF fetch failed, attempting request anyway");
    }
  }

  // Handle file uploads - use FormData
  const processedData = hasFiles ? convertToFormData(data, method) : data;

  // Make the request
  const response = await apiClient.any<ApiResponse<R>>({
    method: getRequestMethod(method, hasFiles),
    data: processedData,
    headers: {
      ...headers,
      "Content-Type": hasFiles ? "multipart/form-data" : "application/json",
    },
    params,
    withCredentials: true,
    ...props,
  });

  // Handle 419 CSRF token mismatch - retry once with fresh token
  if (response.status === 419 && retryOn419) {
    console.warn("CSRF token mismatch (419), refreshing and retrying...");
    try {
      await fetchCsrfCookie();
      // Retry the request with skipCsrf to avoid infinite loop
      return callApi<R>({
        method,
        data,
        params,
        headers,
        shouldPopError,
        hasFiles,
        skipCsrf: true,
        retryOn419: false,
        ...props,
      });
    } catch (retryError) {
      console.error("Retry after CSRF refresh failed:", retryError);
    }
  }

  // Handle response errors
  handleResponse<R>({
    response,
    shouldPopError,
  });

  return response;
};

/**
 * Handle API response - show success/error toasts
 */
type HandleResponseProps<T> = {
  response: ApisauceResponse<ApiResponse<T>, ApiResponse<T>>;
  shouldPopError?: boolean;
};

const handleResponse = <T>({ response, shouldPopError }: HandleResponseProps<T>) => {
  if (response.ok) {
    // Show success message if provided
    if (response.data?.message && response.config?.method !== "get") {
      toast.success(response.data.message);
    }
    return response;
  }

  // Don't show error for cancelled requests
  if (response.originalError?.message === "canceled") {
    return;
  }

  // Handle different error types
  if (!shouldPopError) return;

  if (response.status === 401) {
    // Unauthenticated - let auth store handle this
    return;
  }

  if (response.status === 419) {
    toast.error(
      response.data?.message ?? "Session expired. Please refresh the page and try again."
    );
    return;
  }

  if (response.status === 403) {
    toast.error("You do not have permission to perform this action");
    return;
  }

  if (response.status === 404) {
    toast.error("Resource not found");
    return;
  }

  if (response.status === 422 && response.data?.errors) {
    // Validation errors - show first error
    const errors = response.data.errors;
    const firstError = Object.values(errors)[0];
    if (Array.isArray(firstError) && firstError.length > 0) {
      toast.error(firstError[0]);
    }
    return;
  }

  // Generic error
  const errorMessage =
    response.data?.message ||
    response.data?.error?.messages ||
    response.originalError?.message ||
    "An unexpected error occurred";

  toast.error(typeof errorMessage === "string" ? errorMessage : "An error occurred");
};

/**
 * Convert PUT to POST with _method override for file uploads
 * Laravel doesn't support file uploads in PUT requests
 */
const getRequestMethod = (method: string, hasFiles: boolean): string => {
  if (hasFiles && method.toUpperCase() === RequestMethod.PUT) {
    return RequestMethod.POST;
  }
  return method;
};

/**
 * Convert data object to FormData for file uploads
 */
const convertToFormData = (data: ObjectAny, method: string): FormData => {
  const formData = new FormData();

  // Add _method override for PUT requests
  if (method.toUpperCase() === RequestMethod.PUT) {
    formData.append("_method", "PUT");
  }

  // Recursively append data to FormData
  appendToFormData(formData, data);

  return formData;
};

/**
 * Recursively append data to FormData
 */
const appendToFormData = (formData: FormData, data: ObjectAny, parentKey = ""): void => {
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      const formKey = parentKey ? `${parentKey}[${key}]` : key;

      if (value === null || value === undefined) {
        continue;
      }

      if (value instanceof File) {
        formData.append(formKey, value);
      } else if (value instanceof FileList) {
        Array.from(value).forEach((file, index) => {
          formData.append(`${formKey}[${index}]`, file);
        });
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object" && !(item instanceof File)) {
            appendToFormData(formData, item, `${formKey}[${index}]`);
          } else {
            formData.append(`${formKey}[${index}]`, item);
          }
        });
      } else if (typeof value === "object") {
        appendToFormData(formData, value, formKey);
      } else {
        formData.append(formKey, String(value));
      }
    }
  }
};

export default callApi;
