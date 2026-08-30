import { Link } from "react-router-dom";
import { Button, Card, CardContent, DataTable, PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import type { DataTableConfig } from "@/types/datatable";
import { extractUpcomingInstallments, useUpcomingInstallments } from "../../hooks/useUpcomingInstallments";
import type { UpcomingInstallmentRow } from "../../data/models/FinanceReport";

function PaymentBadge({ value, label }: { value?: string | null; label?: string | null }) {
  const raw = String(value ?? "pending");
  const colors: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    paid: "bg-success/10 text-success",
    partial: "bg-info/10 text-info",
    mof_pending: "bg-auxiliary/10 text-auxiliary",
    other_party: "bg-info/10 text-info",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[raw] ?? "bg-muted text-muted-foreground")}>
      {label || raw}
    </span>
  );
}

const UpcomingDuesPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { params, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    defaultSortBy: "next_due_date",
    defaultSortDir: "asc",
  });
  const { data, isLoading } = useUpcomingInstallments(2);
  const rows = extractUpcomingInstallments(data);

  const config: DataTableConfig<UpcomingInstallmentRow> = {
    columns: [
      {
        key: "next_due_date",
        header: t("finance.columns.nextInstallment"),
        sortable: false,
        render: (row) => <span className="font-medium">{row.next_due_date || "—"}</span>,
      },
      {
        key: "student_name",
        header: t("finance.columns.name"),
        sortable: false,
        render: (row) => (
          <div>
            <div className="font-medium">{row.student_name || "—"}</div>
            {row.student_code ? (
              <div className="font-mono text-xs text-muted-foreground">{row.student_code}</div>
            ) : null}
          </div>
        ),
      },
      {
        key: "father_name",
        header: t("finance.columns.fatherName"),
        sortable: false,
        render: (row) => row.father_name || "—",
      },
      {
        key: "phone_number",
        header: t("finance.details.phone"),
        sortable: false,
        render: (row) => row.phone_number || "—",
      },
      {
        key: "class_name",
        header: t("finance.columns.class"),
        sortable: false,
        render: (row) => (
          <div>
            <div>{row.class_name || "—"}</div>
            {row.class_code ? <div className="font-mono text-xs text-muted-foreground">{row.class_code}</div> : null}
          </div>
        ),
      },
      {
        key: "payment_status",
        header: t("finance.columns.paymentStatus"),
        sortable: false,
        render: (row) => <PaymentBadge value={row.payment_status} label={row.payment_status_label} />,
      },
    ],
    rowId: (row) => row.id,
    searchable: false,
    filtersEnabled: false,
    paginationEnabled: false,
    emptyMessage: t("finance.upcomingDues.empty"),
  };

  if (!hasPermission("finance.read")) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("finance.upcomingDues.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("finance.upcomingDues.subtitle")}</p>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                { label: t("finance.title"), to: "/finance" },
                { label: t("finance.upcomingDues.title") },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/finance/receive-payment">{t("finance.receivePayment.title")}</Link>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/finance">{t("finance.receivePayment.backToReport")}</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">{t("finance.upcomingDues.hint")}</CardContent>
      </Card>

      <DataTable
        data={rows}
        config={config}
        params={params}
        onParamsChange={updateParams}
        isLoading={isLoading}
      />
    </div>
  );
};

export default UpcomingDuesPage;
