import { Link, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Shield, Key, Group } from "iconoir-react";
import { Spinner } from "@/components/ui/spinner";
import { useRole } from "../../hooks";
import { Button } from "@/components/ui";
import { Can } from "@/features/auth";

const RoleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const fromView = (location.state as { fromView?: "card" | "table" })?.fromView;
  const backUrl = fromView ? `/roles?view=${fromView}` : "/roles";

  const roleId = id ? parseInt(id, 10) : 0;
  const { data, isLoading, error } = useRole(roleId);
  const role = data?.data;

  if (isLoading || !roleId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="rounded-lg border border-danger/20 bg-red-50 p-6 text-center dark:bg-red-900/10">
        <p className="text-danger">Role not found or failed to load.</p>
        <Link to={backUrl} className="mt-4 inline-block text-primary hover:underline">
          Back to Roles
        </Link>
      </div>
    );
  }

  const isSystemRole = ["admin", "root", "student", "instructor"].includes(
    role.name?.toLowerCase() ?? ""
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to={backUrl}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Roles
        </Link>
        <Can permission="roles.update">
          <Button asChild variant="outline">
            <Link to={`/roles/${role.id}/edit`}>Edit Role</Link>
          </Button>
        </Can>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold capitalize text-foreground">{role.name}</h1>
            {isSystemRole && (
              <span className="mt-1 inline-block text-sm text-muted-foreground">System Role</span>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Group className="h-5 w-5" />
              <span className="text-sm font-medium">Users</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{role.users_count ?? 0}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Key className="h-5 w-5" />
              <span className="text-sm font-medium">Permissions</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {role.permissions_count ?? role.permissions?.length ?? 0}
            </p>
          </div>
        </div>

        {role.permissions && role.permissions.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Permissions</h2>
            <div className="flex flex-wrap gap-2">
              {role.permissions.map((permission) => (
                <span
                  key={permission.id}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                >
                  {permission.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {role.users && role.users.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Users with this role ({role.users.length})
            </h2>
            <ul className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
              {role.users.map((u) => (
                <li key={u.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{u.name}</span>
                  <Link to={`/users?edit=${u.id}`} className="text-primary hover:underline">
                    {u.email}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleDetail;
