import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  EditPencil,
  Trash,
  Shield,
  Group,
  Key,
  ViewGrid,
  List,
  MoreVert,
} from "iconoir-react";
import { useRoles, useDeleteRole, useDeleteRoleMutation } from "../../hooks";
import { Role } from "../../data/models";
import {
  Button,
  DataTable,
  useConfirmDialog,
  confirmPresets,
} from "@/components/ui";
import { Can, CanAny } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import type {
  DataTableConfig,
  DataTablePaginationMeta,
} from "@/types/datatable";
import { cn } from "@/lib/utils";

function getListFromResponse(response: unknown): Role[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: Role[] | { data?: Role[] } }).data;
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { data?: Role[] }).data)
  )
    return (data as { data: Role[] }).data;
  return [];
}

function getPaginationFromResponse(response: unknown): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  const meta = (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta;
  return meta?.pagination ?? null;
}

const RoleList = () => {
  const navigate = useNavigate();
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 10,
    defaultSortBy: "name",
    defaultSortDir: "asc",
    searchDebounceMs: 400,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  const viewMode: "card" | "table" =
    viewParam === "card" || viewParam === "table" ? viewParam : "table";
  const setViewMode = (mode: "card" | "table") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("view", mode);
      return next;
    });
  };

  const apiParams = {
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  };

  const { data, isLoading, error } = useRoles(apiParams);
  const roles = getListFromResponse(data);
  const pagination = getPaginationFromResponse(data);
  const { confirm } = useConfirmDialog();
  const { mutate: deleteRole } = useDeleteRoleMutation();

  const config: DataTableConfig<Role> = {
    columns: [
      {
        key: "name",
        header: "Role",
        render: (role) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium capitalize text-foreground">{role.name}</p>
              {["admin", "root", "student", "instructor"].includes(role.name.toLowerCase()) && (
                <span className="text-xs text-muted-foreground">System Role</span>
              )}
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        key: "users_count",
        header: "Users",
        render: (role) => (
          <span className="text-muted-foreground">{role.users_count ?? 0}</span>
        ),
      },
      {
        key: "permissions_count",
        header: "Permissions",
        render: (role) => (
          <span className="text-muted-foreground">
            {role.permissions_count ?? role.permissions?.length ?? 0}
          </span>
        ),
      },
    ],
    rowId: (role) => role.id,
    searchable: true,
    searchPlaceholder: "Search roles...",
    filtersEnabled: false,
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50],
    paginationEnabled: true,
    emptyMessage: "No roles yet.",
    actions: [
      {
        key: "edit",
        label: "Edit",
        icon: <EditPencil className="h-4 w-4" />,
        onClick: (role) => {
          if (!["admin", "root", "student", "instructor"].includes(role.name.toLowerCase())) {
            navigate(`/roles/${role.id}/edit`);
          }
        },
        permission: "roles.update",
      },
      {
        key: "delete",
        label: "Delete",
        icon: <Trash className="h-4 w-4" />,
        variant: "danger",
        onClick: async (role) => {
          if (!["admin", "root", "student", "instructor"].includes(role.name.toLowerCase())) {
            const confirmed = await confirm(confirmPresets.delete(`"${role.name}"`));
            if (confirmed) {
              deleteRole({ id: role.id });
            }
          }
        },
        permission: "roles.delete",
      },
    ],
  };

  // useDeleteRole(0) - we need to pass roleId when calling. The mutation is bound to id. We need useDeleteRole to accept id in the mutation variables or we need a different approach. Let me create useDeleteRoleMutation similar to useUpdateUserMutation.
  // Actually useDeleteRole(id) - when we call deleteRole(), it uses the id from the hook. So we need one mutation per role, or a generic delete. Let me add useDeleteRoleById that takes { id } in the mutation.
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles</h1>
          <p className="text-muted-foreground">Manage user roles and their permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-1">
            <button
              onClick={() => setViewMode("card")}
              className={cn(
                "rounded-md p-2",
                viewMode === "card" ? "bg-muted" : "hover:bg-muted/50"
              )}
              title="Card view"
            >
              <ViewGrid className="h-4 w-4" />
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
          <Can permission="roles.create">
            <Link to={`/roles/create${viewMode === "card" ? "?view=card" : ""}`}>
              <Button>
                <Plus className="h-4 w-4" />
                Add Role
              </Button>
            </Link>
          </Can>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/20 bg-light-danger p-6 text-center">
          <p className="text-danger">Failed to load roles. Please try again.</p>
        </div>
      ) : viewMode === "table" ? (
        <DataTable
          data={roles}
          config={config}
          params={params}
          onParamsChange={updateParams}
          pagination={pagination}
          isLoading={isLoading}
        />
      ) : (
        // Card view - add search bar
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search roles..."
              value={params.search}
              onChange={(e) => updateParams({ search: e.target.value, page: 1 })}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {roles.length === 0 ? (
            <EmptyState viewMode={viewMode} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <RoleCard key={role.id} role={role} viewMode={viewMode} />
              ))}
            </div>
          )}
          {/* Simple pagination for card view */}
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.current_page <= 1}
                  onClick={() => updateParams({ page: pagination.current_page - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.has_more_pages}
                  onClick={() => updateParams({ page: pagination.current_page + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// RoleCard - reuse from original
interface RoleCardProps {
  role: Role;
  viewMode: "card" | "table";
}

const RoleCard = ({ role, viewMode }: RoleCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRole(role.id);
  const { confirm } = useConfirmDialog();

  const isSystemRole = ["admin", "root", "student", "instructor"].includes(role.name.toLowerCase());

  const handleDelete = async () => {
    setShowMenu(false);
    const confirmed = await confirm(confirmPresets.delete("Role"));
    if (confirmed) {
      deleteRole();
    }
  };

  return (
    <div className="group relative rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold capitalize text-foreground">{role.name}</h3>
            {isSystemRole && <span className="text-xs text-muted-foreground">System Role</span>}
          </div>
        </div>

        {!isSystemRole && (
          <CanAny permissions={["roles.update", "roles.delete"]}>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="rounded-lg p-1 hover:bg-muted"
              >
                <MoreVert className="h-4 w-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-card py-1 shadow-lg">
                    <Can permission="roles.update">
                      <Link
                        to={`/roles/${role.id}/edit`}
                        state={{ fromView: viewMode }}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                      >
                        <EditPencil className="h-4 w-4" />
                        Edit
                      </Link>
                    </Can>
                    <Can permission="roles.delete">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-muted"
                      >
                        <Trash className="h-4 w-4" />
                        Delete
                      </button>
                    </Can>
                  </div>
                </>
              )}
            </div>
          </CanAny>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Group className="h-4 w-4" />
            <span className="text-xs">Users</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground">{role.users_count || 0}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Key className="h-4 w-4" />
            <span className="text-xs">Permissions</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {role.permissions_count || role.permissions?.length || 0}
          </p>
        </div>
      </div>

      {role.permissions && role.permissions.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Permissions</p>
          <div className="flex flex-wrap gap-1">
            {role.permissions.slice(0, 4).map((permission) => (
              <span
                key={permission.id}
                className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {permission.name}
              </span>
            ))}
            {role.permissions.length > 4 && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                +{role.permissions.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      <Link
        to={`/roles/${role.id}`}
        state={{ fromView: viewMode }}
        className="mt-4 block text-center text-sm text-primary hover:underline"
      >
        View Details
      </Link>
    </div>
  );
};

const EmptyState = ({ viewMode }: { viewMode: "card" | "table" }) => (
  <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
      <Shield className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="mb-2 font-semibold text-foreground">No roles yet</h3>
    <p className="mb-4 text-sm text-muted-foreground">Get started by creating your first role.</p>
    <Can permission="roles.create">
      <Link to={`/roles/create${viewMode === "card" ? "?view=card" : ""}`}>
        <Button>
          <Plus className="h-4 w-4" />
          Add Role
        </Button>
      </Link>
    </Can>
  </div>
);

export default RoleList;
