import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Eye, EyeOff, Camera } from "lucide-react";
import { useUser, useCreateUser, useUpdateUser } from "../../hooks";
import { z } from "zod";
import type { UserManagement } from "../../data/models";
import { Button } from "@/components/ui";
import {
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const CreateUserFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password_confirmation: z.string(),
  avatar: z.any().optional(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

const UpdateUserFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  password_confirmation: z.string().optional().or(z.literal("")),
  avatar: z.any().optional(),
}).refine((data) => !data.password || data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

type CreateUserFormData = z.infer<typeof CreateUserFormSchema>;
type UpdateUserFormData = z.infer<typeof UpdateUserFormSchema>;

interface UserFormDrawerProps {
  user: UserManagement | null;
  onSuccess: () => void;
}

export const UserFormDrawer = ({ user, onSuccess }: UserFormDrawerProps) => {
  const isEdit = !!user;
  const [showPassword, setShowPassword] = useState(false);

  const { data: existingData, isLoading: isLoadingUser } = useUser(user?.id ?? 0);
  const existingUser = existingData?.data;

  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser(user?.id ?? 0);
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEdit ? UpdateUserFormSchema : CreateUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  });

  const avatarFiles = watch("avatar");

  useEffect(() => {
    if (existingUser && isEdit) {
      reset({
        name: existingUser.name,
        email: existingUser.email,
        password: "",
        password_confirmation: "",
      });
    } else if (!user) {
      reset({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
      });
    }
  }, [existingUser, user, isEdit, reset]);

  const onSubmit = (data: CreateUserFormData | UpdateUserFormData) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      status: user?.status || "active",
    };
    if (!isEdit || data.password) {
      payload.password = data.password;
      payload.password_confirmation = data.password_confirmation;
    }
    const avatar = (data as { avatar?: FileList }).avatar?.[0];
    if (avatar instanceof File) {
      payload.avatar = avatar;
    }

    if (isEdit && user) {
      updateUser(payload, { onSuccess });
    } else {
      createUser(payload, { onSuccess });
    }
  };

  const avatarPreview =
    avatarFiles?.[0] instanceof File
      ? URL.createObjectURL(avatarFiles[0])
      : existingUser?.avatar || null;

  if (isEdit && isLoadingUser && !existingUser) {
    return (
      <>
        <DrawerHeader>
          <DrawerTitle>Edit User</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DrawerBody>
      </>
    );
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{isEdit ? "Edit User" : "Create User"}</DrawerTitle>
        <DrawerDescription>
          {isEdit
            ? "Update user information"
            : "Add a new user to the system. Assign roles separately via the Role action."}
        </DrawerDescription>
      </DrawerHeader>

      <form id="user-form" onSubmit={handleSubmit(onSubmit)}>
        <DrawerBody className="space-y-4">
          {/* Avatar */}
          <div>
            <label htmlFor="avatar-upload" className="mb-1.5 block text-sm font-medium">Profile Picture</label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="avatar-upload"
                className={cn(
                  "flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-input bg-muted transition-colors hover:border-primary hover:bg-muted/80"
                )}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </label>
              <div className="flex-1">
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  {...register("avatar")}
                />
                <p className="text-xs text-muted-foreground">Click to upload (JPG, PNG, max 2MB)</p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              {...register("name")}
              className={cn(
                "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                errors.name ? "border-danger" : "border-input"
              )}
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger">{(errors as Record<string, { message?: string }>).name?.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Email <span className="text-danger">*</span>
            </label>
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
              <p className="mt-1 text-xs text-danger">{(errors as Record<string, { message?: string }>).email?.message}</p>
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
              <p className="mt-1 text-xs text-danger">{(errors as Record<string, { message?: string }>).password?.message}</p>
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
                {(errors as Record<string, { message?: string }>).password_confirmation?.message}
              </p>
            )}
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button type="submit" form="user-form" disabled={isSubmitting}>
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
        </DrawerFooter>
      </form>
    </>
  );
};
