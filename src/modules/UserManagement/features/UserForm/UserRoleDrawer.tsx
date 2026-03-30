import { useEffect, useState } from "react";
import { Loader2, Save, Shield } from "lucide-react";
import { useUser, useUpdateUser, useRoles } from "../../hooks";
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

interface UserRoleDrawerProps {
  user: UserManagement | null;
  onSuccess: () => void;
}

export const UserRoleDrawer = ({ user, onSuccess }: UserRoleDrawerProps) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { data: userData, isLoading: isLoadingUser } = useUser(user?.id ?? 0);
  const { data: rolesData } = useRoles();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser(user?.id ?? 0);

  const existingUser = userData?.data;
  const roles = rolesData?.data || [];

  useEffect(() => {
    if (existingUser?.roles) {
      setSelectedRoles(existingUser.roles.map((r) => r.name));
    } else {
      setSelectedRoles([]);
    }
  }, [existingUser]);

  const toggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    );
  };

  const onSubmit = () => {
    updateUser({ roles: selectedRoles } as Record<string, unknown>, { onSuccess });
  };

  if (!user) return null;

  if (isLoadingUser && !existingUser) {
    return (
      <>
        <DrawerHeader>
          <DrawerTitle>Assign Roles</DrawerTitle>
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
        <DrawerTitle>Assign Roles</DrawerTitle>
        <DrawerDescription>
          Assign roles to {existingUser?.name || user.name}. Changes take effect immediately.
        </DrawerDescription>
      </DrawerHeader>

      <DrawerBody>
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
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                selectedRoles.includes(role.name)
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-muted hover:bg-muted/80"
              )}
            >
              <Shield className="h-4 w-4" />
              {role.name}
            </button>
          ))}
          {roles.length === 0 && (
            <p className="text-sm text-muted-foreground">No roles available</p>
          )}
        </div>
      </DrawerBody>

      <DrawerFooter>
        <Button onClick={onSubmit} disabled={isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Roles
            </>
          )}
        </Button>
      </DrawerFooter>
    </>
  );
};
