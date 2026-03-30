import { useState, useMemo } from "react";
import {
  Search,
  Key,
  Shield,
  Loader2,
  LayoutGrid,
  List,
} from "lucide-react";
import { usePermissions } from "../../hooks";
import { Permission } from "../../data/models";
import { DataTable } from "@/components/ui";
import { useDataTableParams } from "@/hooks";
import type {
  DataTableConfig,
  DataTablePaginationMeta,
} from "@/types/datatable";
import { cn } from "@/lib/utils";

function getListFromResponse(response: unknown): Permission[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: Permission[] | { data?: Permission[] } }).data;
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { data?: Permission[] }).data)
  )
    return (data as { data: Permission[] }).data;
  return [];
}

function getPaginationFromResponse(response: unknown): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  const meta = (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta;
  return meta?.pagination ?? null;
}

const PermissionList = () => {
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    defaultSortBy: "name",
    defaultSortDir: "asc",
    searchDebounceMs: 400,
  });

  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const apiParams = {
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  };

  const { data, isLoading, error } = usePermissions(apiParams);
  const permissions = getListFromResponse(data);
  const pagination = getPaginationFromResponse(data);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((permission) => {
      const [module] = permission.name.split(".");
      if (!groups[module]) {
        groups[module] = [];
      }
      groups[module].push(permission);
    });
    return groups;
  }, [permissions]);

  const config: DataTableConfig<Permission> = {
    columns: [
      {
        key: "name",
        header: "Permission",
        render: (perm) => (
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{perm.name}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "module",
        header: "Module",
        render: (perm) => {
          const [module] = perm.name.split(".");
          return (
            <span className="capitalize text-muted-foreground">{module || "general"}</span>
          );
        },
      },
      {
        key: "guard_name",
        header: "Guard",
        render: (perm) => (
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {perm.guard_name}
          </span>
        ),
      },
    ],
    rowId: (perm) => perm.id,
    searchable: true,
    searchPlaceholder: "Search permissions...",
    filtersEnabled: false,
    defaultPageSize: 25,
    pageSizeOptions: [25, 50, 100],
    paginationEnabled: true,
    emptyMessage: "No permissions found.",
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger/20 bg-light-danger p-6 text-center">
        <p className="text-danger">Failed to load permissions. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Permissions</h1>
          <p className="text-muted-foreground">View all available system permissions</p>
        </div>
        <div className="flex rounded-lg border border-border p-1">
          <button
            onClick={() => setViewMode("card")}
            className={cn(
              "rounded-md p-2",
              viewMode === "card" ? "bg-muted" : "hover:bg-muted/50"
            )}
            title="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "rounded-md p-2",
              viewMode === "table" ? "bg-muted" : "hover:bg-muted/50"
            )}
            title="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-2xl font-bold text-foreground">
            {pagination?.total ?? permissions.length}
          </p>
          <p className="text-xs text-muted-foreground">Total Permissions</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-2xl font-bold text-foreground">
            {Object.keys(groupedPermissions).length}
          </p>
          <p className="text-xs text-muted-foreground">Modules (this page)</p>
        </div>
      </div>

      {viewMode === "table" ? (
        <DataTable
          data={permissions}
          config={config}
          params={params}
          onParamsChange={updateParams}
          pagination={pagination}
          isLoading={false}
        />
      ) : (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={params.search}
              onChange={(e) => updateParams({ search: e.target.value, page: 1 })}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {Object.keys(groupedPermissions).length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Key className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No permissions found.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <div key={module} className="rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize text-foreground">{module}</h3>
                        <p className="text-xs text-muted-foreground">{perms.length} permissions</p>
                      </div>
                    </div>
                    <div className="divide-y divide-border">
                      {perms.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{permission.name}</span>
                          </div>
                          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {permission.guard_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
                    {Math.min(
                      pagination.current_page * pagination.per_page,
                      pagination.total
                    )}{" "}
                    of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                      disabled={pagination.current_page <= 1}
                      onClick={() => updateParams({ page: pagination.current_page - 1 })}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                      disabled={!pagination.has_more_pages}
                      onClick={() => updateParams({ page: pagination.current_page + 1 })}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PermissionList;
