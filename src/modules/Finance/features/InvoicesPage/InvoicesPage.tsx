import { Page } from "iconoir-react";
import { Link } from "react-router-dom";
import { Button, DataTable, PageBreadcrumb } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import type { DataTableConfig } from "@/types/datatable";
import {
  extractFinanceInvoices,
  extractFinanceInvoicesPagination,
  useFinanceInvoices,
} from "../../hooks/useFinanceInvoices";
import type { FinanceInvoiceRow } from "../../data/models/FinanceReport";

function formatMoney(value: unknown, currency?: string | null): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return currency ? `${formatted} ${currency}` : formatted;
}

const InvoicesPage = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    searchDebounceMs: 400,
  });

  const { data, isLoading } = useFinanceInvoices({
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
  });

  const rows = extractFinanceInvoices(data);
  const pagination = extractFinanceInvoicesPagination(data);

  const openPdf = (url?: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const config: DataTableConfig<FinanceInvoiceRow> = {
    columns: [
      {
        key: "invoice_number",
        header: t("finance.invoices.columns.number"),
        sortable: false,
        render: (row) => <span className="font-mono text-xs">{row.invoice_number}</span>,
      },
      {
        key: "issued_at",
        header: t("finance.invoices.columns.date"),
        sortable: false,
        render: (row) => row.issued_at || "—",
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
        key: "customer_name",
        header: t("finance.manualInvoice.customerName"),
        sortable: false,
        render: (row) => row.customer_name || "—",
      },
      {
        key: "amount",
        header: t("finance.columns.amount"),
        sortable: false,
        align: "right",
        render: (row) => formatMoney(row.amount, row.currency),
      },
    ],
    rowId: (row) => row.id,
    searchable: true,
    searchPlaceholder: t("finance.invoices.search"),
    filtersEnabled: false,
    paginationEnabled: true,
    emptyMessage: t("finance.invoices.empty"),
    actions: [
      {
        key: "print",
        label: t("finance.invoices.print"),
        icon: <Page className="h-4 w-4" />,
        onClick: (row) => openPdf(row.pdf_url),
        hidden: (row) => !row.pdf_url,
      },
    ],
  };

  if (!hasPermission("finance.read")) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("finance.invoices.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("finance.invoices.subtitle")}</p>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                { label: t("finance.title"), to: "/finance" },
                { label: t("finance.invoices.title") },
              ]}
            />
          </div>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link to="/finance">{t("finance.receivePayment.backToReport")}</Link>
        </Button>
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

export default InvoicesPage;
