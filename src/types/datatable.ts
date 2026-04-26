/**
 * DataTable Types
 *
 * Production-grade, reusable DataTable configuration.
 * Supports server-side pagination, sorting, filtering, and search.
 *
 * @remarks
 * Future: Typesense integration can be added via a searchAdapter prop
 * that overrides the default server-side search behavior.
 */

export type SortDirection = "asc" | "desc";

export interface DataTablePaginationMeta {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  has_more_pages: boolean;
}

export interface DataTableFilterOption {
  value: string | number | boolean;
  label: string;
}

export interface DataTableColumnConfig<T = unknown> {
  /** Unique column key, maps to API sort_by / filter param */
  key: string;
  /** Header label */
  header: string;
  /** Cell renderer */
  render: (row: T) => React.ReactNode;
  /** Whether column is sortable (default: true) */
  sortable?: boolean;
  /** Whether column has filter dropdown (default: false) */
  filterable?: boolean;
  /** Filter options for dropdown. If absent, filter is disabled for this column. */
  filterOptions?: DataTableFilterOption[];
  /** Min width (e.g. "120px") for column */
  minWidth?: string;
  /** Column alignment */
  align?: "left" | "center" | "right";
}

export interface DataTableActionItem<T = unknown> {
  key: string;
  label: string | ((row: T) => string);
  icon?: React.ReactNode | ((row: T) => React.ReactNode);
  onClick: (row: T) => void;
  variant?: "default" | "danger" | ((row: T) => "default" | "danger");
  /** When set, the action is only rendered if the user holds this permission. */
  permission?: string;
}

export interface DataTableConfig<T = unknown> {
  /** Column definitions */
  columns: DataTableColumnConfig<T>[];
  /** Unique row identifier for keys */
  rowId: (row: T) => string | number;
  /** Actions dropdown config. If not provided, no actions column. */
  actions?: DataTableActionItem<T>[];
  /** Enable search input (default: true) */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search param key for API (default: "search") */
  searchParamKey?: string;
  /** Enable column filters (default: true). Can disable all filters. */
  filtersEnabled?: boolean;
  /** Default page size options */
  pageSizeOptions?: number[];
  /** Default page size (default: 10) */
  defaultPageSize?: number;
  /** Enable pagination (default: true) */
  paginationEnabled?: boolean;
  /** Show record count in footer, e.g. "1 to 10 of 100 records" (default: true) */
  showRecordCount?: boolean;
  /** Empty state message */
  emptyMessage?: string;
}

export interface DataTableParams {
  search: string;
  page: number;
  per_page: number;
  sort_by: string;
  sort_dir: SortDirection;
  filters: Record<string, string | number | boolean | undefined>;
}

export interface DataTableProps<T = unknown> {
  /** Data rows */
  data: T[];
  /** Table configuration */
  config: DataTableConfig<T>;
  /** Current params (from useDataTableParams) */
  params: DataTableParams;
  /** Param change handlers */
  onParamsChange: (updates: Partial<DataTableParams>) => void;
  /** Pagination metadata from API */
  pagination?: DataTablePaginationMeta | null;
  /** Loading state */
  isLoading?: boolean;
  /** Optional: adapter for Typesense or other search backends (future) */
  // searchAdapter?: DataTableSearchAdapter;
}
