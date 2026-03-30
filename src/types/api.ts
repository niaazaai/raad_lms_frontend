import { ObjectAny } from "./base";

/**
 * API Error structure
 */
export interface ApiError {
  identifier?: string;
  messages: string | string[];
  code?: string;
  severity?: string;
}

/**
 * Pagination metadata (matches Laravel ApiResponse meta.pagination)
 */
export interface PageMeta {
  currentPage?: number;
  current_page?: number;
  pageNumber?: number;
  pageSize?: number;
  per_page?: number;
  firstPage?: string;
  lastPage?: number;
  totalPages?: number;
  total_pages?: number;
  total: number;
  count?: number;
  nextPage?: string;
  previousPage?: string;
  has_more_pages?: boolean;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = ObjectAny> {
  data: T;
  status?: string;
  success: boolean;
  message?: string;
  error?: ApiError;
  meta?: PageMeta;
  errors?: Record<string, string[]>;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = ObjectAny> extends ApiResponse<T[]> {
  meta: PageMeta;
}

/**
 * ID response from create/update operations
 */
export interface IdResponse {
  id: number;
}

/**
 * Generic payload types for CRUD operations
 */
export type GetAllPayload = {
  params?: ObjectAny;
};

export type SearchActionPayload = {
  data?: [];
  params?: ObjectAny;
};

export type GetByIdActionPayload = {
  id: number;
  params?: ObjectAny;
};

export type InsertActionPayload<T> = {
  data: T;
  params?: ObjectAny;
};

export type UpdateActionPayload<T> = {
  id: number;
  data: T;
  params?: ObjectAny;
};

export type DeleteActionPayload = {
  id: number;
  params?: ObjectAny;
};
