import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Group, Shield, NavArrowRight } from "iconoir-react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth";
import { useDashboardStats } from "@/hooks";

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    if (searchParams.get("from") === "google") {
      const next = new URLSearchParams(searchParams);
      next.delete("from");
      setSearchParams(next, { replace: true });
    }
  }, []);

  const { data: statsRes, isLoading: loadingStats } = useDashboardStats();
  const stats = (statsRes?.data ?? statsRes ?? {}) as Record<string, number>;

  const hasUsersPermission = hasPermission("users.read");
  const hasRolesPermission = hasPermission("roles.read");
  const hasDashboardPermission = hasPermission("dashboard.read");

  const hasAdminDashboard = hasDashboardPermission || hasUsersPermission || hasRolesPermission;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div
        className="relative overflow-hidden rounded-2xl p-8"
        style={{
          background:
            "linear-gradient(135deg, #004d87 0%, #0069B4 50%, #0080d6 100%)",
          color: "white",
        }}
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.name || "User"}!
          </h1>
          <p className="mt-2 text-white/90">
            {"Hope you're having a great day!"}
          </p>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -left-4 bottom-4 h-24 w-24 rounded-full bg-white/5" />
      </div>

      {hasAdminDashboard && (
        <>
          {loadingStats ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex h-32 items-center justify-center rounded-xl border border-border bg-card"
                >
                  <Spinner className="h-8 w-8 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {hasUsersPermission && "active_users_count" in stats && (
                <StatCard
                  title="Active Users"
                  value={String(stats.active_users_count ?? 0)}
                  icon={<Group className="h-5 w-5" />}
                  color="primary"
                />
              )}
              {hasUsersPermission && "total_users_count" in stats && (
                <StatCard
                  title="Total Users"
                  value={String(stats.total_users_count ?? 0)}
                  icon={<Group className="h-5 w-5" />}
                  color="info"
                />
              )}
            </div>
          )}

          {(hasUsersPermission || hasRolesPermission) && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-semibold text-foreground">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                {hasUsersPermission && (
                  <QuickAction
                    icon={<Group className="h-4 w-4" />}
                    label="Manage Users"
                    href="/users"
                  />
                )}
                {hasRolesPermission && (
                  <QuickAction
                    icon={<Shield className="h-4 w-4" />}
                    label="Manage Roles"
                    href="/roles"
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!hasAdminDashboard && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Welcome to the dashboard. Use the sidebar to navigate.
          </p>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "info" | "danger";
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
    danger: "bg-danger/10 text-danger",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{title}</p>
    </div>
  );
};

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const QuickAction = ({ icon, label, href }: QuickActionProps) => (
  <Link
    to={href}
    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted"
  >
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    <span className="text-sm font-medium text-foreground">{label}</span>
    <NavArrowRight className="h-4 w-4 text-muted-foreground" />
  </Link>
);

export default DashboardPage;
