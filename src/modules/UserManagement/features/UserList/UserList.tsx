import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Edit, Shield, UserX, Mail, Trash2 } from "lucide-react";
import { useUsers, useUpdateUserMutation, useDeleteUserMutation } from "../../hooks";
import { UserManagement, UserStatus, UserStatusLabels, UserStatusColors } from "../../data/models";
import { UserFormDrawer } from "../UserForm/UserFormDrawer";
import { UserRoleDrawer } from "../UserForm/UserRoleDrawer";
import {
  Button,
  DataTable,
  useConfirmDialog,
  confirmPresets,
} from "@/components/ui";
import { Can } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import type {
  DataTableConfig,
  DataTablePaginationMeta,
} from "@/types/datatable";
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
} from "@/components/ui";
import { cn } from "@/lib/utils";

function getListFromResponse(response: unknown): UserManagement[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: UserManagement[] | { data?: UserManagement[] } }).data;
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { data?: UserManagement[] }).data)
  )
    return (data as { data: UserManagement[] }).data;
  return [];
}

function getPaginationFromResponse(response: unknown): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  const meta = (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta;
  return meta?.pagination ?? null;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const UserList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const apiParams = {
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
    status: (params.filters.status as string) || undefined,
  };

  const { data, isLoading, error } = useUsers(apiParams);
  const users = getListFromResponse(data);
  const pagination = getPaginationFromResponse(data);

  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagement | null>(null);
  const [roleUser, setRoleUser] = useState<UserManagement | null>(null);

  const { confirm } = useConfirmDialog();
  const { mutate: updateUser } = useUpdateUserMutation();
  const { mutate: deleteUser } = useDeleteUserMutation();

  const openCreateDrawer = useCallback(() => {
    setEditingUser(null);
    setFormDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((user: UserManagement) => {
    setEditingUser(user);
    setFormDrawerOpen(true);
  }, []);

  const closeFormDrawer = useCallback(() => {
    setFormDrawerOpen(false);
    setEditingUser(null);
    const next = new URLSearchParams(searchParams);
    next.delete("edit");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (editId && users.length > 0) {
      const id = parseInt(editId, 10);
      const user = users.find((u) => u.id === id);
      if (user) {
        setEditingUser(user);
        setFormDrawerOpen(true);
      }
    }
  }, [editId, users]);

  const openRoleDrawer = useCallback((user: UserManagement) => {
    setRoleUser(user);
    setRoleDrawerOpen(true);
  }, []);

  const closeRoleDrawer = useCallback(() => {
    setRoleDrawerOpen(false);
    setRoleUser(null);
  }, []);

  const config: DataTableConfig<UserManagement> = {
    columns: [
      {
        key: "user",
        header: "User",
        render: (user) => (
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "";
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    const fallback = parent?.querySelector("[data-avatar-fallback]");
                    if (fallback instanceof HTMLElement) fallback.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                data-avatar-fallback
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary",
                  user.avatar && "absolute inset-0"
                )}
                style={user.avatar ? { display: "none" } : undefined}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <p className="font-medium text-foreground">{user.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                {user.email}
              </div>
            </div>
          </div>
        ),
        sortable: true,
        filterable: false,
      },
      {
        key: "roles",
        header: "Roles",
        render: (user) => (
          <div className="flex flex-wrap gap-1">
            {user.roles?.map((role) => (
              <span
                key={role.id}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                <Shield className="h-3 w-3" />
                {role.name}
              </span>
            ))}
            {(!user.roles || user.roles.length === 0) && (
              <span className="text-xs text-muted-foreground">No roles</span>
            )}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (user) => {
          const raw = String(user.status ?? "active");
          const status =
            raw === "inactive" || raw === "suspended" || raw === "pending"
              ? UserStatus.INACTIVE
              : UserStatus.ACTIVE;
          const statusColor = UserStatusColors[status];
          return (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                statusColor === "success" && "bg-success/10 text-success",
                statusColor === "warning" && "bg-warning/10 text-warning",
                statusColor === "danger" && "bg-danger/10 text-danger",
                statusColor === "secondary" && "bg-secondary text-muted-foreground"
              )}
            >
              {UserStatusLabels[status]}
            </span>
          );
        },
        sortable: true,
        filterable: true,
        filterOptions: STATUS_OPTIONS,
      },
      {
        key: "created_at",
        header: "Created",
        render: (user) => (
          <span className="text-sm text-muted-foreground">
            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
          </span>
        ),
        sortable: true,
      },
    ],
    rowId: (user) => user.id,
    searchable: true,
    searchPlaceholder: "Search users...",
    filtersEnabled: true,
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    paginationEnabled: true,
    emptyMessage: "No users yet.",
    actions: [
      {
        key: "edit",
        label: "Edit",
        icon: <Edit className="h-4 w-4" />,
        onClick: (user) => openEditDrawer(user),
        permission: "users.update",
      },
      {
        key: "role",
        label: "Role",
        icon: <Shield className="h-4 w-4" />,
        onClick: (user) => openRoleDrawer(user),
        permission: "roles.update",
      },
      {
        key: "toggle",
        label: "Suspend / Activate",
        icon: <UserX className="h-4 w-4" />,
        variant: "danger" as const,
        onClick: async (user) => {
          const raw = String(user.status ?? "active");
          const isInactive =
            raw === "inactive" || raw === "suspended" || raw === "pending";
          const preset = isInactive
            ? confirmPresets.activate("User")
            : confirmPresets.suspend("User");
          const confirmed = await confirm(preset);
          if (confirmed) {
            const newStatus = isInactive ? UserStatus.ACTIVE : UserStatus.INACTIVE;
            updateUser({ id: user.id, data: { status: newStatus } });
          }
        },
        permission: "users.update",
      },
      {
        key: "delete",
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        variant: "danger" as const,
        onClick: async (user) => {
          const confirmed = await confirm(confirmPresets.delete("User"));
          if (confirmed) {
            deleteUser({ id: user.id });
          }
        },
        permission: "users.delete",
      },
    ],
  };

  // For status toggle we need a different approach - use a custom action component
  // Let me simplify: create a UserActionsCell component that gets the user and has the mutation
  // Or: add useUpdateUser in a wrapper. Actually the simplest is to have a hook that takes (userId, data) - useMutationApi with a dynamic URL. We can create useUpdateUserMutation that accepts id in the variables: { id: number, ...data }. Let me add that.
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Can permission="users.create">
          <Button onClick={openCreateDrawer}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </Can>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/20 bg-light-danger p-6 text-center">
          <p className="text-danger">Failed to load users. Please try again.</p>
        </div>
      ) : (
        <DataTable
          data={users}
          config={config}
          params={params}
          onParamsChange={updateParams}
          pagination={pagination}
          isLoading={isLoading}
        />
      )}

      {/* User Form Drawer */}
      <Drawer open={formDrawerOpen} onClose={closeFormDrawer}>
        <DrawerOverlay />
        <DrawerContent>
          <UserFormDrawer
            user={editingUser}
            onSuccess={closeFormDrawer}
          />
        </DrawerContent>
      </Drawer>

      {/* Role Assignment Drawer */}
      <Drawer open={roleDrawerOpen} onClose={closeRoleDrawer}>
        <DrawerOverlay />
        <DrawerContent>
          <UserRoleDrawer user={roleUser} onSuccess={closeRoleDrawer} />
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default UserList;
