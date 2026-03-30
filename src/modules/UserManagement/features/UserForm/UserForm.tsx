import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useUser, useCreateUser, useUpdateUser, useRoles } from "../../hooks";
import { CreateUserSchema, UpdateUserSchema } from "../../data/models";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface UserFormProps {
  mode?: "create" | "edit";
}

const UserForm = ({ mode = "create" }: UserFormProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = id ? parseInt(id) : 0;
  const isEdit = mode === "edit";
  const [showPassword, setShowPassword] = useState(false);

  // Fetch existing user if editing
  const { data: existingData, isLoading: isLoadingUser } = useUser(userId);
  const user = existingData?.data;

  // Fetch available roles
  const { data: rolesData } = useRoles();
  const roles = rolesData?.data || [];

  // Mutations
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser(userId);

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
    resolver: zodResolver((isEdit ? UpdateUserSchema : CreateUserSchema) as any),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      roles: [] as string[],
    },
  });

  const selectedRoles = watch("roles") || [];

  // Populate form with existing data when editing
  useEffect(() => {
    if (user && isEdit) {
      reset({
        name: user.name,
        email: user.email,
        password: "",
        password_confirmation: "",
        roles: user.roles?.map((r) => r.name) || [],
      });
    }
  }, [user, isEdit, reset]);

  const toggleRole = (roleName: string) => {
    const current = selectedRoles;
    if (current.includes(roleName)) {
      setValue(
        "roles",
        current.filter((r: string) => r !== roleName)
      );
    } else {
      setValue("roles", [...current, roleName]);
    }
  };

  const onSubmit = (data: Record<string, unknown>) => {
    if (isEdit) {
      updateUser(data as Parameters<typeof updateUser>[0], {
        onSuccess: () => navigate("/users"),
      });
    } else {
      createUser(data as Parameters<typeof createUser>[0], {
        onSuccess: () => navigate("/users"),
      });
    }
  };

  if (isEdit && isLoadingUser) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? "Edit User" : "Create User"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update user information and roles" : "Add a new user to the system"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-foreground">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Full Name *</label>
              <input
                {...register("name")}
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                  errors.name ? "border-danger" : "border-input"
                )}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-danger">{errors.name.message as string}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Email *</label>
              <input
                {...register("email")}
                type="email"
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                  errors.email ? "border-danger" : "border-input"
                )}
                placeholder="user@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-danger">{errors.email.message as string}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Password {isEdit && "(leave blank to keep current)"}
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className={cn(
                    "w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                    errors.password ? "border-danger" : "border-input"
                  )}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger">{errors.password.message as string}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirm Password</label>
              <input
                {...register("password_confirmation")}
                type={showPassword ? "text" : "password"}
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                  errors.password_confirmation ? "border-danger" : "border-input"
                )}
                placeholder="Confirm password"
              />
              {errors.password_confirmation && (
                <p className="mt-1 text-xs text-danger">
                  {errors.password_confirmation.message as string}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold text-foreground">Roles</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Select the roles to assign to this user.
          </p>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.name)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  selectedRoles.includes(role.name)
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-muted hover:bg-muted/80"
                )}
              >
                {role.name}
              </button>
            ))}
            {roles.length === 0 && (
              <p className="text-sm text-muted-foreground">No roles available</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
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
                {isEdit ? "Update User" : "Create User"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
