import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Group,
  Shield,
  NavArrowRight,
  Dollar,
  GraduationCap,
  BookStack,
  Calendar,
  User,
} from "iconoir-react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth";
import { useDashboardStats, useDashboardAnalytics } from "@/hooks";
import { AnalyticsLineChart, Sparkline } from "@/components/dashboard/DashboardCharts";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { useFormatMessage } from "@/i18n/useConfirmPresets";

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (searchParams.get("from") === "google") {
      const next = new URLSearchParams(searchParams);
      next.delete("from");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: statsRes, isLoading: loadingStats } = useDashboardStats();
  const { data: analyticsRes, isLoading: loadingAnalytics } = useDashboardAnalytics();

  const stats = statsRes?.data ?? {};
  const analytics = analyticsRes?.data ?? {};

  const hasDashboardPermission = hasPermission("dashboard.read");
  const hasAnalyticsPermission =
    hasPermission("dashboard.analytics.read") || hasDashboardPermission;
  const hasUsersPermission = hasPermission("users.read");
  const hasRolesPermission = hasPermission("roles.read");

  const hasAdminDashboard =
    hasDashboardPermission || hasUsersPermission || hasRolesPermission || hasAnalyticsPermission;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value) + " AFN";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#004d87] via-primary to-[#0080d6] p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white">
            {t("dashboard.welcomeBack")}, {user?.name || t("header.user")}!
          </h1>
          <p className="mt-2 text-white/90">{t("dashboard.greeting")}</p>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -left-4 bottom-4 h-24 w-24 rounded-full bg-white/5" />
      </div>

      {hasAdminDashboard && (
        <>
          {loadingStats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex h-36 items-center justify-center rounded-xl border border-border bg-card"
                >
                  <Spinner className="h-8 w-8 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {hasAnalyticsPermission && stats.total_earnings != null && (
                <EarningsStatCard
                  totalEarnings={stats.total_earnings}
                  changePercent={stats.monthly_revenue_change_percent ?? 0}
                  sparkline={stats.monthly_revenue_sparkline ?? []}
                  formatCurrency={formatCurrency}
                />
              )}
              {stats.total_users_count != null && (
                <StatCard
                  title={t("dashboard.totalUsers")}
                  value={String(stats.total_users_count)}
                  icon={<Group className="h-5 w-5" />}
                  color="info"
                />
              )}
              {stats.total_students_count != null && (
                <StatCard
                  title={t("dashboard.totalStudents")}
                  value={String(stats.total_students_count)}
                  icon={<GraduationCap className="h-5 w-5" />}
                  color="primary"
                />
              )}
              {stats.total_courses_count != null && (
                <StatCard
                  title={t("dashboard.totalCourses")}
                  value={String(stats.total_courses_count)}
                  icon={<BookStack className="h-5 w-5" />}
                  color="auxiliary"
                />
              )}
              {stats.total_classes_count != null && (
                <StatCard
                  title={t("dashboard.totalClasses")}
                  value={String(stats.total_classes_count)}
                  icon={<Calendar className="h-5 w-5" />}
                  color="warning"
                />
              )}
              {stats.total_instructors_count != null && (
                <StatCard
                  title={t("dashboard.totalInstructors")}
                  value={String(stats.total_instructors_count)}
                  icon={<User className="h-5 w-5" />}
                  color="success"
                />
              )}
            </div>
          )}

          {hasAnalyticsPermission && (
            <>
              {loadingAnalytics ? (
                <div className="grid gap-4 xl:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex h-64 items-center justify-center rounded-xl border border-border bg-card"
                    >
                      <Spinner className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-4">
                  <AnalyticsLineChart
                    title={t("dashboard.earningsOverTime")}
                    subtitle={t("dashboard.earningsSubtitle")}
                    data={analytics.earnings_over_time ?? []}
                    valueSuffix=" AFN"
                    colorClass="text-primary"
                  />
                  <AnalyticsLineChart
                    title={t("dashboard.enrollmentsOverTime")}
                    subtitle={t("dashboard.enrollmentsSubtitle")}
                    data={analytics.enrollments_over_time ?? []}
                    colorClass="text-success"
                  />
                  <AnalyticsLineChart
                    title={t("dashboard.classesOverTime")}
                    subtitle={t("dashboard.classesSubtitle")}
                    data={analytics.classes_over_time ?? []}
                    colorClass="text-auxiliary"
                  />
                  <AnalyticsLineChart
                    title={t("dashboard.registrationsOverTime")}
                    subtitle={t("dashboard.registrationsSubtitle")}
                    data={analytics.user_registrations_over_time ?? []}
                    colorClass="text-info"
                  />
                </div>
              )}
            </>
          )}

          {(hasUsersPermission || hasRolesPermission) && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-semibold text-foreground">{t("dashboard.quickActions")}</h2>
              <div className="flex flex-wrap gap-3">
                {hasUsersPermission && (
                  <QuickAction
                    icon={<Group className="h-4 w-4" />}
                    label={t("dashboard.manageUsers")}
                    href="/users"
                  />
                )}
                {hasRolesPermission && (
                  <QuickAction
                    icon={<Shield className="h-4 w-4" />}
                    label={t("dashboard.manageRoles")}
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
            {t("dashboard.noAdminAccess")}
          </p>
        </div>
      )}
    </div>
  );
};

interface EarningsStatCardProps {
  totalEarnings: number;
  changePercent: number;
  sparkline: { date: string; value: number }[];
  formatCurrency: (value: number) => string;
}

const EarningsStatCard = ({
  totalEarnings,
  changePercent,
  sparkline,
  formatCurrency,
}: EarningsStatCardProps) => {
  const { t } = useTranslation();
  const fmt = useFormatMessage();
  const isPositive = changePercent >= 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-success/20 bg-gradient-to-br from-success/5 via-card to-card p-5">
      <div className="absolute right-4 top-4 rounded-lg bg-success/15 p-2 text-success">
        <Dollar className="h-5 w-5" />
      </div>
      <p className="pr-12 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("dashboard.totalEarnings")}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground xl:text-3xl">
        {formatCurrency(totalEarnings)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            isPositive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}
        >
          {isPositive ? "+" : ""}
          {fmt("dashboard.monthlyChange", { percent: String(changePercent) })}
        </span>
      </div>
      {sparkline.length > 0 && (
        <div className="mt-3 border-t border-success/10 pt-3">
          <Sparkline data={sparkline} className="h-9 w-full text-success" />
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "info" | "danger" | "auxiliary";
}

const CARD_THEMES = {
  primary: {
    border: "border-primary/20",
    bg: "from-primary/8 via-card to-card",
    icon: "bg-primary/15 text-primary",
  },
  success: {
    border: "border-success/20",
    bg: "from-success/8 via-card to-card",
    icon: "bg-success/15 text-success",
  },
  warning: {
    border: "border-warning/20",
    bg: "from-warning/8 via-card to-card",
    icon: "bg-warning/15 text-warning",
  },
  info: {
    border: "border-info/20",
    bg: "from-info/8 via-card to-card",
    icon: "bg-info/15 text-info",
  },
  danger: {
    border: "border-danger/20",
    bg: "from-danger/8 via-card to-card",
    icon: "bg-danger/15 text-danger",
  },
  auxiliary: {
    border: "border-auxiliary/20",
    bg: "from-auxiliary/8 via-card to-card",
    icon: "bg-auxiliary/15 text-auxiliary",
  },
} as const;

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const theme = CARD_THEMES[color];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-5",
        theme.border,
        theme.bg
      )}
    >
      <div className={cn("absolute right-4 top-4 rounded-lg p-2", theme.icon)}>{icon}</div>
      <p className="pr-12 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground xl:text-3xl">{value}</p>
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
