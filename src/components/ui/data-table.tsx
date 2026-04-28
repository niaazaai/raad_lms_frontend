"use client";

import * as React from "react";
import {
  NavArrowDown,
  NavArrowLeft,
  NavArrowRight,
  Filter,
  MoreHoriz,
  Search,
  ArrowSeparateVertical,
  NavArrowUp,
} from "iconoir-react";
import { Spinner } from "./spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./dropdown-menu";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import type {
  DataTableConfig,
  DataTableActionItem,
  DataTableParams,
  DataTablePaginationMeta,
  DataTableColumnConfig,
  SortDirection,
} from "@/types/datatable";
import { useAuth } from "@/features/auth";

export interface DataTableProps<T = unknown> {
  data: T[];
  config: DataTableConfig<T>;
  params: DataTableParams;
  onParamsChange: (updates: Partial<DataTableParams>) => void;
  pagination?: DataTablePaginationMeta | null;
  isLoading?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250];

function ColumnHeader<T>({
  column,
  params,
  filtersEnabled,
  onSort,
  onFilter,
}: {
  column: DataTableColumnConfig<T>;
  params: DataTableParams;
  filtersEnabled: boolean;
  onSort: (key: string, dir: SortDirection) => void;
  onFilter: (key: string, value: string | number | boolean | undefined) => void;
}) {
  const isSorted = params.sort_by === column.key;
  const currentFilter = params.filters[column.key];
  const hasFilter = currentFilter !== undefined && currentFilter !== "";
  const canFilter =
    filtersEnabled &&
    column.filterable !== false &&
    column.filterOptions &&
    column.filterOptions.length > 0;

  const SortIcon = isSorted
    ? params.sort_dir === "asc"
      ? NavArrowUp
      : NavArrowDown
    : ArrowSeparateVertical;

  return (
    <th
      className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
      style={{ minWidth: column.minWidth }}
    >
      <div className="flex items-center gap-1">
        <span>{column.header}</span>
        {column.sortable !== false && (
          <button
            type="button"
            onClick={() =>
              onSort(column.key, isSorted && params.sort_dir === "asc" ? "desc" : "asc")
            }
            className="rounded p-0.5 hover:bg-muted"
            aria-label={`Sort by ${column.header}`}
          >
            <SortIcon className="h-3.5 w-3.5" />
          </button>
        )}
        {canFilter && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn("rounded p-0.5 hover:bg-muted", hasFilter && "text-primary")}
                aria-label={`Filter ${column.header}`}
              >
                <Filter className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              <DropdownMenuLabel>Filter by {column.header}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={
                  currentFilter === undefined || currentFilter === "" ? "" : String(currentFilter)
                }
                onValueChange={(v) => {
                  if (v === "") {
                    onFilter(column.key, undefined);
                    return;
                  }
                  const opt = column.filterOptions!.find((o) => String(o.value) === v);
                  onFilter(column.key, opt ? opt.value : undefined);
                }}
              >
                <DropdownMenuRadioItem value="">All</DropdownMenuRadioItem>
                {column.filterOptions!.map((opt) => (
                  <DropdownMenuRadioItem key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </th>
  );
}

function ActionsCell<T>({
  row,
  actions,
  rowId: _rowId,
}: {
  row: T;
  actions: NonNullable<DataTableConfig<T>["actions"]>;
  rowId: (r: T) => string | number;
}) {
  const resolveLabel = (action: DataTableActionItem<T>) =>
    typeof action.label === "function" ? action.label(row) : action.label;
  const resolveIcon = (action: DataTableActionItem<T>) =>
    typeof action.icon === "function" ? action.icon(row) : action.icon;
  const resolveVariant = (action: DataTableActionItem<T>) =>
    typeof action.variant === "function" ? action.variant(row) : action.variant;

  return (
    <td className="whitespace-nowrap px-4 py-3 text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Actions">
            <MoreHoriz className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.key}
              variant={resolveVariant(action)}
              onSelect={() => action.onClick(row)}
            >
              {resolveIcon(action)}
              {resolveLabel(action)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </td>
  );
}

function usePermissionFilteredActions<T>(
  actions: DataTableActionItem<T>[] | undefined
): DataTableActionItem<T>[] {
  const { hasPermission } = useAuth();
  return React.useMemo(() => {
    if (!actions) return [];
    return actions.filter((a) => !a.permission || hasPermission(a.permission));
  }, [actions, hasPermission]);
}

export function DataTable<T>({
  data,
  config,
  params,
  onParamsChange,
  pagination,
  isLoading = false,
}: DataTableProps<T>) {
  const {
    columns,
    rowId,
    actions,
    searchable = true,
    searchPlaceholder = "Search...",
    filtersEnabled = true,
    pageSizeOptions = PAGE_SIZE_OPTIONS,
    paginationEnabled = true,
    showRecordCount = true,
    emptyMessage = "No records found.",
  } = config;

  const visibleActions = usePermissionFilteredActions(actions);
  const hasActions = visibleActions.length > 0;

  const meta = pagination;
  const total = meta?.total ?? 0;
  const currentPage = meta?.current_page ?? 1;
  const totalPages = meta?.total_pages ?? 1;
  const perPage = params.per_page;
  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  const setSort = React.useCallback(
    (key: string, dir: SortDirection) => {
      onParamsChange({ sort_by: key, sort_dir: dir, page: 1 });
    },
    [onParamsChange]
  );

  const setFilter = React.useCallback(
    (key: string, value: string | number | boolean | undefined) => {
      onParamsChange({
        filters: { ...params.filters, [key]: value },
        page: 1,
      });
    },
    [onParamsChange, params.filters]
  );

  return (
    <div className="space-y-4">
      {/* Search - top left */}
      {searchable && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={params.search}
            onChange={(e) => onParamsChange({ search: e.target.value, page: 1 })}
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            aria-label="Search"
          />
        </div>
      )}

      {/* Table - horizontal scroll container */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-max">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {columns.map((col) => (
                <ColumnHeader
                  key={col.key}
                  column={col}
                  params={params}
                  filtersEnabled={filtersEnabled}
                  onSort={setSort}
                  onFilter={setFilter}
                />
              ))}
              {hasActions && (
                <th className="w-14 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="px-4 py-16 text-center"
                >
                  <Spinner className="mx-auto h-8 w-8 text-primary" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={String(rowId(row))} className="hover:bg-muted/30">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-sm",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right"
                      )}
                      style={{ minWidth: col.minWidth }}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                  {hasActions && <ActionsCell row={row} actions={visibleActions} rowId={rowId} />}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {paginationEnabled && total > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {showRecordCount && (
              <span className="text-sm text-muted-foreground">
                {from} to {to} of {total} records
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {perPage} per page
                  <NavArrowDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {pageSizeOptions.map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onSelect={() => onParamsChange({ per_page: size, page: 1 })}
                  >
                    {size} per page
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onParamsChange({ page: currentPage - 1 })}
              disabled={currentPage <= 1}
            >
              <NavArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onParamsChange({ page: currentPage + 1 })}
              disabled={currentPage >= totalPages}
            >
              Next
              <NavArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
