import { useState, useCallback, useMemo } from "react";
import { useDebounce } from "./useDebounce";
import type { DataTableParams, SortDirection } from "@/types/datatable";

export interface UseDataTableParamsConfig {
  /** Default page size */
  defaultPageSize?: number;
  /** Default sort column */
  defaultSortBy?: string;
  /** Default sort direction */
  defaultSortDir?: SortDirection;
  /** Search debounce delay in ms (default: 400) */
  searchDebounceMs?: number;
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_DEBOUNCE_MS = 400;

/**
 * useDataTableParams
 *
 * Manages DataTable state: search (debounced), pagination, sorting, filters.
 * Use the returned params with your API hook; use debouncedSearch for the
 * actual request to avoid re-rendering the whole page on every keystroke.
 *
 * @example
 * const { params, debouncedSearch, setSearch, setPage, ... } = useDataTableParams({
 *   defaultPageSize: 10,
 *   defaultSortBy: 'created_at',
 * });
 *
 * const { data } = useMyItems({
 *   search: debouncedSearch || undefined,
 *   page: params.page,
 *   per_page: params.per_page,
 *   sort_by: params.sort_by,
 *   sort_dir: params.sort_dir,
 *   ...params.filters,
 * });
 */
export function useDataTableParams(config: UseDataTableParamsConfig = {}) {
  const {
    defaultPageSize = DEFAULT_PAGE_SIZE,
    defaultSortBy = "created_at",
    defaultSortDir = "desc" as SortDirection,
    searchDebounceMs = DEFAULT_DEBOUNCE_MS,
  } = config;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPageSize);
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDir);
  const [filters, setFilters] = useState<Record<string, string | number | boolean | undefined>>({});

  const debouncedSearch = useDebounce(search, searchDebounceMs);

  const params: DataTableParams = useMemo(
    () => ({
      search,
      page,
      per_page: perPage,
      sort_by: sortBy,
      sort_dir: sortDir,
      filters,
    }),
    [search, page, perPage, sortBy, sortDir, filters]
  );

  const updateParams = useCallback((updates: Partial<DataTableParams>) => {
    if ("search" in updates) setSearch(updates.search ?? "");
    if ("page" in updates) setPage(updates.page ?? 1);
    if ("per_page" in updates) {
      setPerPage(updates.per_page ?? DEFAULT_PAGE_SIZE);
      setPage(1); // Reset to first page when changing page size
    }
    if ("sort_by" in updates) setSortBy(updates.sort_by ?? "id");
    if ("sort_dir" in updates) setSortDir((updates.sort_dir ?? "desc") as SortDirection);
    if ("filters" in updates) {
      setFilters(updates.filters ?? {});
      setPage(1); // Reset to first page when filters change
    }
  }, []);

  const setPageInternal = useCallback((p: number) => setPage(p), []);
  const setPerPageInternal = useCallback((pp: number) => {
    setPerPage(pp);
    setPage(1);
  }, []);
  const setFilter = useCallback((key: string, value: string | number | boolean | undefined) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === undefined || value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setPage(1);
  }, []);
  const setSort = useCallback((by: string, dir: SortDirection) => {
    setSortBy(by);
    setSortDir(dir);
    setPage(1);
  }, []);

  return {
    params,
    debouncedSearch,
    search,
    setSearch,
    setPage: setPageInternal,
    setPerPage: setPerPageInternal,
    setSort,
    setFilter,
    setFilters,
    updateParams,
  };
}
