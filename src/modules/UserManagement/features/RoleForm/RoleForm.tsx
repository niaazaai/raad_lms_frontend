import { useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save, Shield, Check } from "lucide-react";
import { useRole, useCreateRole, useUpdateRole, usePermissions } from "../../hooks";
import { CreateRoleSchema } from "../../data/models";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface RoleFormProps {
  mode?: "create" | "edit";
}

const RoleForm = ({ mode = "create" }: RoleFormProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const fromView =
    (location.state as { fromView?: "card" | "table" })?.fromView ||
    (searchParams.get("view") === "card" ? "card" : "table");
  const rolesUrl = `/roles?view=${fromView}`;

  const roleId = id ? parseInt(id) : 0;
  const isEdit = mode === "edit";

  // Fetch existing role if editing
  const { data: existingData, isLoading: isLoadingRole } = useRole(roleId);
  const role = (existingData as { data?: { name?: string; permissions?: { name: string }[] } })?.data;

  // Fetch available permissions
  const { data: permissionsData } = usePermissions();
  const permissions = permissionsData?.data || [];

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, typeof permissions> = {};
    permissions.forEach((permission) => {
      const [module] = permission.name.split(".");
      if (!groups[module]) {
        groups[module] = [];
      }
      groups[module].push(permission);
    });
    return groups;
  }, [permissions]);

  // Mutations
  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole(roleId);

  const isSubmitting = isCreating || isUpdating;

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreateRoleSchema),
    defaultValues: {
      name: "",
      permissions: [] as string[],
    },
  });

  const selectedPermissions = watch("permissions") || [];

  // Populate form with existing data when editing
  useEffect(() => {
    if (role && isEdit) {
      const permNames = Array.isArray(role.permissions)
        ? role.permissions.map((p: { name: string } | string) =>
            typeof p === "string" ? p : p.name
          )
        : [];
      reset({
        name: role.name ?? "",
        permissions: permNames,
      });
    }
  }, [role, isEdit, reset]);

  const togglePermission = (permissionName: string) => {
    const current = selectedPermissions;
    if (current.includes(permissionName)) {
      setValue(
        "permissions",
        current.filter((p: string) => p !== permissionName)
      );
    } else {
      setValue("permissions", [...current, permissionName]);
    }
  };

  const toggleAllInModule = (moduleName: string) => {
    const modulePerms = groupedPermissions[moduleName]?.map((p) => p.name) || [];
    const allSelected = modulePerms.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      setValue(
        "permissions",
        selectedPermissions.filter((p: string) => !modulePerms.includes(p))
      );
    } else {
      const newPerms = new Set([...selectedPermissions, ...modulePerms]);
      setValue("permissions", Array.from(newPerms));
    }
  };

  const allPermissionNames = useMemo(
    () => permissions.map((p) => p.name),
    [permissions]
  );
  const allSelected = allPermissionNames.length > 0 && allPermissionNames.every((p) => selectedPermissions.includes(p));
  const someSelected = allPermissionNames.some((p) => selectedPermissions.includes(p));

  const toggleSelectAll = () => {
    if (allSelected) {
      setValue("permissions", []);
    } else {
      setValue("permissions", [...allPermissionNames]);
    }
  };

  const onSubmit = (data: Record<string, unknown>) => {
    if (isEdit) {
      updateRole(data as Parameters<typeof updateRole>[0], {
        onSuccess: () => navigate(rolesUrl),
      });
    } else {
      createRole(data as Parameters<typeof createRole>[0], {
        onSuccess: () => navigate(rolesUrl),
      });
    }
  };

  if (isEdit && isLoadingRole) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(rolesUrl)} className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? "Edit Role" : "Create Role"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update role and permissions" : "Create a new role with permissions"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-foreground">Role Information</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Role Name *</label>
            <input
              {...register("name")}
              className={cn(
                "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                errors.name ? "border-danger" : "border-input"
              )}
              placeholder="e.g., manager, editor, viewer"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger">{errors.name.message as string}</p>
            )}
          </div>
        </div>

        {/* Permissions */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Permissions</h2>
            <span className="text-sm text-muted-foreground">
              {selectedPermissions.length} of {permissions.length} selected
            </span>
          </div>

          {permissions.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="mb-4 flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 hover:bg-muted"
            >
              <span className="font-medium">Select all permissions</span>
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded border",
                  allSelected ? "border-primary bg-primary text-white" : "border-input"
                )}
              >
                {allSelected && <Check className="h-3 w-3" />}
                {someSelected && !allSelected && (
                  <div className="h-2 w-2 rounded-sm bg-primary" />
                )}
              </div>
            </button>
          )}

          {Object.keys(groupedPermissions).length === 0 ? (
            <p className="text-sm text-muted-foreground">No permissions available</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(groupedPermissions).map(([module, perms]) => {
                const allSelected = perms.every((p) => selectedPermissions.includes(p.name));
                const someSelected = perms.some((p) => selectedPermissions.includes(p.name));

                return (
                  <div key={module} className="rounded-lg border border-border">
                    {/* Module Header */}
                    <button
                      type="button"
                      onClick={() => toggleAllInModule(module)}
                      className="flex w-full items-center justify-between bg-muted/50 px-4 py-3 hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-medium capitalize">{module}</span>
                        <span className="text-xs text-muted-foreground">
                          ({perms.filter((p) => selectedPermissions.includes(p.name)).length}/
                          {perms.length})
                        </span>
                      </div>
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border",
                          allSelected
                            ? "border-primary bg-primary text-white"
                            : someSelected
                              ? "border-primary bg-primary/20"
                              : "border-input"
                        )}
                      >
                        {allSelected && <Check className="h-3 w-3" />}
                        {someSelected && !allSelected && (
                          <div className="h-2 w-2 rounded-sm bg-primary" />
                        )}
                      </div>
                    </button>

                    {/* Permissions List */}
                    <div className="divide-y divide-border">
                      {perms.map((permission) => {
                        const isSelected = selectedPermissions.includes(permission.name);
                        return (
                          <button
                            key={permission.id}
                            type="button"
                            onClick={() => togglePermission(permission.name)}
                            className="flex w-full items-center justify-between px-4 py-2 hover:bg-muted/30"
                          >
                            <span className="text-sm">{permission.name}</span>
                            <div
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded border",
                                isSelected ? "border-primary bg-primary text-white" : "border-input"
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(rolesUrl)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEdit ? "Update Role" : "Create Role"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;
