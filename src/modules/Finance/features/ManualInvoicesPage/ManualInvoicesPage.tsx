import { useMemo, useState } from "react";
import { Coins, Page, Plus, Wallet } from "iconoir-react";
import { Link } from "react-router-dom";
import { Button, DataTable, Input, Label, PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import type { DataTableConfig } from "@/types/datatable";
import {
  extractManualInvoicePagination,
  extractManualInvoiceRows,
  extractManualInvoiceSummary,
  useManualInvoiceTransactions,
} from "../../hooks/useManualInvoiceTransactions";
import type { ManualInvoiceTransactionRow } from "../../data/models/FinanceReport";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthStart(): string {
  return todayIsoDate().slice(0, 7) + "-01";
}

function formatMoney(value: unknown, currency?: string | null): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return currency ? `${formatted} ${currency}` : formatted;
}

const ManualInvoicesPage = () => {
  const { t } = useTranslation();
  const { hasPermission, hasAnyPermission } = useAuth();
  const [from, setFrom] = useState(currentMonthStart());
  const [to, setTo] = useState(todayIsoDate());

  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    defaultSortBy: "transaction_date",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const { data, isLoading } = useManualInvoiceTransactions({
    from,
    to,
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  });

  const rows = extractManualInvoiceRows(data);
  const pagination = extractManualInvoicePagination(data);
  const summary = extractManualInvoiceSummary(data);

  const canCreate = hasAnyPermission([
    "course.class_students.invoice",
    "course.class_students.payment",
    "course.class_students.update",
  ]);

  const openPdf = (url?: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const config: DataTableConfig<ManualInvoiceTransactionRow> = useMemo(
    () => ({
      columns: [
        {
          key: "transaction_date",
          header: t("finance.manualInvoices.columns.transactionDate"),
          sortable: true,
          render: (row) => row.transaction_date || "—",
        },
        {
          key: "transaction_id",
          header: t("finance.manualInvoices.columns.transactionNumber"),
          sortable: false,
          render: (row) =>
            row.transaction_id ? <span className="font-mono text-xs">{row.transaction_id}</span> : "—",
        },
        {
          key: "invoice_number",
          header: t("finance.invoices.columns.number"),
          sortable: true,
          render: (row) => <span className="font-mono text-xs">{row.invoice_number}</span>,
        },
        {
          key: "customer_name",
          header: t("finance.manualInvoice.customerName"),
          sortable: true,
          render: (row) => row.customer_name || "—",
        },
        {
          key: "student_name",
          header: t("finance.columns.name"),
          sortable: false,
          render: (row) => (
            <div>
              <div className="font-medium">{row.student_name?.trim() || "—"}</div>
              {row.student_code ? (
                <div className="font-mono text-xs text-muted-foreground">{row.student_code}</div>
              ) : null}
            </div>
          ),
        },
        {
          key: "service_name",
          header: t("finance.manualInvoice.serviceName"),
          sortable: true,
          render: (row) => row.service_name || "—",
        },
        {
          key: "amount",
          header: t("finance.manualInvoices.columns.income"),
          sortable: true,
          align: "right",
          render: (row) => formatMoney(row.amount, row.currency),
        },
        {
          key: "service_cost",
          header: t("finance.manualInvoice.serviceCost"),
          sortable: true,
          align: "right",
          render: (row) => formatMoney(row.service_cost, row.currency),
        },
      ],
      rowId: (row) => row.id,
      searchable: true,
      searchPlaceholder: t("finance.manualInvoices.search"),
      filtersEnabled: false,
      paginationEnabled: true,
      emptyMessage: t("finance.manualInvoices.empty"),
      actions: [
        {
          key: "print",
          label: t("finance.invoices.print"),
          icon: <Page className="h-4 w-4" />,
          onClick: (row) => openPdf(row.pdf_url),
          hidden: (row) => !row.pdf_url,
        },
      ],
    }),
    [t],
  );

  if (!hasPermission("finance.read")) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("finance.manualInvoices.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("finance.manualInvoices.subtitle")}</p>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                { label: t("finance.title"), to: "/finance" },
                { label: t("finance.manualInvoices.title") },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/finance">{t("finance.receivePayment.backToReport")}</Link>
          </Button>
          {canCreate ? (
            <Button type="button" asChild>
              <Link to="/finance/manual-invoice">
                <Plus className="h-4 w-4" />
                {t("finance.manualInvoices.create")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="manual-invoices-from">{t("finance.from")}</Label>
          <Input
            id="manual-invoices-from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              updateParams({ page: 1 });
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="manual-invoices-to">{t("finance.to")}</Label>
          <Input
            id="manual-invoices-to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              updateParams({ page: 1 });
            }}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-gradient-to-br from-success/8 via-card to-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("finance.netServiceIncome")}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-success">
                {formatMoney(summary?.service_income ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-success/15 p-2 text-success">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-gradient-to-br from-warning/8 via-card to-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("finance.netServiceCost")}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-warning">
                {formatMoney(summary?.service_cost ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-warning/15 p-2 text-warning">
              <Coins className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className={cn("rounded-xl border border-border bg-gradient-to-br from-muted/40 via-card to-card p-5")}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("finance.manualInvoices.count")}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{summary?.count ?? 0}</p>
        </div>
      </div>

      <DataTable
        data={rows}
        config={config}
        params={params}
        onParamsChange={updateParams}
        pagination={pagination}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ManualInvoicesPage;
