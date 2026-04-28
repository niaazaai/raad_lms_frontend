/**
 * Generic object with any keys and values
 */
export interface ObjectAny {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Lookup option for select inputs
 */
export interface Lookup<T = number | string, DT = ObjectAny> {
  label: string;
  value: T;
  original?: DT;
}

/**
 * Input field types
 */
export type InputType =
  | "text"
  | "email"
  | "select"
  | "file"
  | "radio"
  | "checkbox"
  | "switch"
  | "textarea"
  | "button"
  | "reset"
  | "submit"
  | "date"
  | "datetime-local"
  | "hidden"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "url"
  | "time"
  | "color";

/**
 * Form submission types
 */
export enum FormSubmitType {
  CREATE = "Create",
  UPDATE = "Update",
  DELETE = "Delete",
  VIEW = "View",
}

/**
 * Modal size types
 */
export type ModalSizeType = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

/**
 * Filter operators for API queries
 */
export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "in"
  | "nin"
  | "between"
  | "null"
  | "notnull";

/**
 * Filter type for API queries
 */
export type FilterType = {
  value: string | number;
  operator: FilterOperator;
};

/**
 * Base API filter parameters
 */
export type BaseApiFilterType = {
  search?: string;
  sortBy?: string | null;
  sortDir?: "asc" | "desc";
  globalSearch?: boolean;
  filters?: Record<string, string | number | Record<string, string | number> | FilterType>;
  includes?: Record<string, string | number | Record<string, string | number>>;
  page?: number;
  perPage?: number;
  fromDate?: string;
  toDate?: string;
  type?: string;
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | Record<string, unknown>
    | FilterType;
};

/**
 * Nested key accessor type utility
 */
export type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;

export type NestedKeys<T> = {
  [K in keyof T & (string | number)]: T[K] extends Record<string, unknown>
    ? Join<K, NestedKeys<T[K]>>
    : `${K}`;
}[keyof T & (string | number)];
