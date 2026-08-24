import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardContent, DataTable, Input, Label, PageBreadcrumb, Switch } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import type { DataTableConfig } from "@/types/datatable";
import {
  extractFinancePagination,
  extractFinanceRows,
  extractFinanceSummary,
  useFinanceReport,
} from "../../hooks/useFinanceReport";
import type {
  FinanceClassRow,
  FinanceCourseRow,
  FinanceModule,
  FinancePeriod,
  FinanceSummary,
} from "../../data/models/FinanceReport";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth(): string {
  return todayIsoDate().slice(0, 7);
}

function currentYear(): number {
  return new Date().getFullYear();
}

function formatMoney(value: unknown): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function PaymentBadge({ value, label }: { value?: string | null; label?: string | null }) {
  const raw = String(value ?? "pending");
  const colors: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    paid: "bg-success/10 text-success",
    partial: "bg-info/10 text-info",
    mof_pending: "bg-auxiliary/10 text-auxiliary",
    other_party: "bg-info/10 text-info",
    failed: "bg-danger/10 text-danger",
    refunded: "bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[raw] ?? "bg-muted text-muted-foreground")}>
      {label || raw}
    </span>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

const SummaryCard = ({ label, value, tone = "default" }: SummaryCardProps) => {
  const tones: Record<NonNullable<SummaryCardProps["tone"]>, string> = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-info",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-xl font-semibold tabular-nums", tones[tone])}>{formatMoney(value)}</p>
      </CardContent>
    </Card>
  );
};

const FinanceReportPage = () => {
  const { t } = useTranslation();
  const { hasPermission, hasAnyPermission } = useAuth();
  const [module, setModule] = useState<FinanceModule>("class");
  const [period, setPeriod] = useState<FinancePeriod>("daily");
  const [includePending, setIncludePending] = useState(false);
  const [date, setDate] = useState(todayIsoDate());
  const [month, setMonth] = useState(currentMonth());
  const [year, setYear] = useState(String(currentYear()));
  const [from, setFrom] = useState(currentMonth() + "-01");
  const [to, setTo] = useState(todayIsoDate());

  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 25,
    defaultSortBy: "last_payment_date",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const periodParams = useMemo(() => {
    if (period === "daily") return { date };
    if (period === "yearly") return { year: Number(year) || currentYear() };
    if (period === "range") return { from, to };
    return { month };
  }, [period, date, month, year, from, to]);

  const { data, isLoading } = useFinanceReport({
    module,
    period,
    ...periodParams,
    include_pending: module === "class" ? (includePending ? 1 : 0) : undefined,
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  });

  const rows = extractFinanceRows(data);
  const pagination = extractFinancePagination(data);
  const summary: FinanceSummary = extractFinanceSummary(data) ?? {
    class_income: 0,
    course_income: 0,
    total_income: 0,
    fees_amount: 0,
    discount_amount: 0,
    net_amount: 0,
    paid_amount: 0,
    refund_amount: 0,
    mof_receivable: 0,
    other_receivable: 0,
    irrecoverable_debt: 0,
    net_receivable: 0,
  };

  const setModuleAndReset = (next: FinanceModule) => {
    setModule(next);
    updateParams({ page: 1, sort_by: next === "course" ? "purchase_date" : "last_payment_date" });
  };

  const setPeriodAndReset = (next: FinancePeriod) => {
    setPeriod(next);
    updateParams({ page: 1 });
  };

  const classConfig: DataTableConfig<FinanceClassRow> = {
    columns: [
      {
        key: "student_name",
        header: t("finance.columns.name"),
        sortable: false,
        render: (row) => <span className="font-medium">{row.student_name || "—"}</span>,
      },
      {
        key: "father_name",
        header: t("finance.columns.fatherName"),
        sortable: false,
        render: (row) => row.father_name || "—",
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
        key: "invoice_number",
        header: t("finance.columns.invoice"),
        sortable: false,
        render: (row) => <span className="font-mono text-xs">{row.invoice_number || "—"}</span>,
      },
      {
        key: "schedule_days",
        header: t("finance.columns.days"),
        sortable: false,
        render: (row) => row.schedule_days_label || row.schedule_days || "—",
      },
      {
        key: "timing",
        header: t("finance.columns.timing"),
        sortable: false,
        render: (row) => row.timing || "—",
      },
      {
        key: "fees_amount",
        header: t("finance.columns.fees"),
        sortable: false,
        align: "right",
        render: (row) => formatMoney(row.fees_amount),
      },
      {
        key: "discount_percent",
        header: t("finance.columns.discountPercent"),
        sortable: false,
        align: "right",
        render: (row) => formatMoney(row.discount_percent),
      },
      {
        key: "discount_amount",
        header: t("finance.columns.discountAmount"),
        sortable: false,
        align: "right",
        render: (row) => formatMoney(row.discount_amount),
      },
      {
        key: "net_amount",
        header: t("finance.columns.net"),
        sortable: false,
        align: "right",
        render: (row) => formatMoney(row.net_amount),
      },
      {
        key: "paid_amount",
        header: t("finance.columns.paid"),
        sortable: false,
        align: "right",
        render: (row) => formatMoney(row.paid_amount),
      },
      {
        key: "refund_amount",
        header: t("finance.columns.refund"),
        sortable: false,
        align: "right",
        render: (row) => formatMoney(row.refund_amount),
      },
      {
        key: "mof_receivable_amount",
        header: t("finance.columns.mof"),
        sortable: false,
        align: "right",
        render: (row) => formatMoney(row.mof_receivable_amount),
      },
      {
        key: "other_receivable_amount",
        header: t("finance.columns.other"),
        sortable: false,
        render: (row) => {
          const amount = formatMoney(row.other_receivable_amount);
          if (!row.other_party_name) return amount;
          return (
            <span>
              {amount}{" "}
              <span className="text-xs text-muted-foreground">({row.other_party_name})</span>
            </span>
          );
        },
      },
      {
        key: "irrecoverable_debt",
        header: t("finance.columns.irrecoverable"),
        sortable: false,
        align: "right",
        render: (row) => formatMoney(row.irrecoverable_debt),
      },
      {
        key: "net_receivable",
        header: t("finance.columns.netReceivable"),
        sortable: false,
        align: "right",
        render: (row) => (
          <span className="font-medium tabular-nums">{formatMoney(row.net_receivable)}</span>
        ),
      },
      {
        key: "payment_date",
        header: t("finance.columns.paymentDate"),
        sortable: true,
        render: (row) => row.payment_date || "—",
      },
      {
        key: "teacher_name",
        header: t("finance.columns.teacher"),
        sortable: false,
        render: (row) => row.teacher_name || "—",
      },
      {
        key: "payment_status",
        header: t("finance.columns.paymentStatus"),
        sortable: true,
        render: (row) => <PaymentBadge value={row.payment_status} label={row.payment_status_label} />,
      },
      {
        key: "class_status",
        header: t("finance.columns.classStatus"),
        sortable: false,
        render: (row) => row.class_status_label || row.class_status || "—",
      },
      {
        key: "starting_date",
        header: t("finance.columns.startingDate"),
        sortable: false,
        render: (row) => row.starting_date || "—",
      },
      {
        key: "next_installment_date",
        header: t("finance.columns.nextInstallment"),
        sortable: false,
        render: (row) => row.next_installment_date || "—",
      },
      {
        key: "remarks",
        header: t("finance.columns.remarks"),
        sortable: false,
        render: (row) => row.remarks || "—",
      },
    ],
    rowId: (row) => row.id,
    searchable: true,
    searchPlaceholder: t("finance.searchClass"),
    filtersEnabled: false,
    paginationEnabled: true,
    emptyMessage: t("finance.empty"),
  };

  const courseConfig: DataTableConfig<FinanceCourseRow> = {
    columns: [
      {
        key: "student_name",
        header: t("finance.columns.student"),
        sortable: false,
        render: (row) => <span className="font-medium">{row.student_name || "—"}</span>,
      },
      {
        key: "course_title",
        header: t("finance.columns.course"),
        sortable: false,
        render: (row) => row.course_title || "—",
      },
      {
        key: "plan_name",
        header: t("finance.columns.plan"),
        sortable: false,
        render: (row) => row.plan_name || "—",
      },
      {
        key: "amount",
        header: t("finance.columns.amount"),
        sortable: false,
        align: "right",
        render: (row) => formatMoney(row.amount),
      },
      {
        key: "payment_status",
        header: t("finance.columns.paymentStatus"),
        sortable: true,
        render: (row) => <PaymentBadge value={row.payment_status} label={row.payment_status_label} />,
      },
      {
        key: "purchase_date",
        header: t("finance.columns.purchaseDate"),
        sortable: true,
        render: (row) => row.purchase_date || "—",
      },
      {
        key: "subscription_status",
        header: t("finance.columns.subscriptionStatus"),
        sortable: false,
        render: (row) => row.subscription_status_label || row.subscription_status || "—",
      },
    ],
    rowId: (row) => row.id,
    searchable: true,
    searchPlaceholder: t("finance.searchCourse"),
    filtersEnabled: false,
    paginationEnabled: true,
    emptyMessage: t("finance.empty"),
  };

  if (!hasPermission("finance.read")) {
    return <PermissionDeniedCard />;
  }

  const canReceivePayment = hasAnyPermission(["course.class_students.payment", "course.class_students.update"]);

  const periodTabs: { value: FinancePeriod; label: string }[] = [
    { value: "daily", label: t("finance.periodDaily") },
    { value: "monthly", label: t("finance.periodMonthly") },
    { value: "yearly", label: t("finance.periodYearly") },
    { value: "range", label: t("finance.periodRange") },
  ];

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("finance.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("finance.subtitle")}</p>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                { label: t("finance.title") },
              ]}
            />
          </div>
        </div>
        {canReceivePayment ? (
          <Button type="button" asChild>
            <Link to="/finance/receive-payment">{t("finance.receivePayment.title")}</Link>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-border p-1">
          <Button type="button" size="sm" variant={module === "class" ? "default" : "ghost"} onClick={() => setModuleAndReset("class")}>
            {t("finance.classModule")}
          </Button>
          <Button type="button" size="sm" variant={module === "course" ? "default" : "ghost"} onClick={() => setModuleAndReset("course")}>
            {t("finance.courseModule")}
          </Button>
        </div>
        <div className="inline-flex rounded-lg border border-border p-1">
          {periodTabs.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              size="sm"
              variant={period === tab.value ? "default" : "ghost"}
              onClick={() => setPeriodAndReset(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        {period === "daily" ? (
          <div className="space-y-1">
            <Label htmlFor="finance-date">{t("finance.date")}</Label>
            <Input id="finance-date" type="date" value={date} onChange={(e) => { setDate(e.target.value); updateParams({ page: 1 }); }} />
          </div>
        ) : null}
        {period === "monthly" ? (
          <div className="space-y-1">
            <Label htmlFor="finance-month">{t("finance.month")}</Label>
            <Input id="finance-month" type="month" value={month} onChange={(e) => { setMonth(e.target.value); updateParams({ page: 1 }); }} />
          </div>
        ) : null}
        {period === "yearly" ? (
          <div className="space-y-1">
            <Label htmlFor="finance-year">{t("finance.year")}</Label>
            <Input id="finance-year" type="number" min={2000} max={2100} value={year} onChange={(e) => { setYear(e.target.value); updateParams({ page: 1 }); }} />
          </div>
        ) : null}
        {period === "range" ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="finance-from">{t("finance.from")}</Label>
              <Input id="finance-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); updateParams({ page: 1 }); }} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="finance-to">{t("finance.to")}</Label>
              <Input id="finance-to" type="date" value={to} onChange={(e) => { setTo(e.target.value); updateParams({ page: 1 }); }} />
            </div>
          </div>
        ) : null}
        {module === "class" ? (
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Switch
              id="include-pending"
              checked={includePending}
              onCheckedChange={(checked) => {
                setIncludePending(checked);
                updateParams({ page: 1 });
              }}
            />
            <Label htmlFor="include-pending" className="cursor-pointer text-sm font-normal">
              {t("finance.includePending")}
            </Label>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {module === "class" ? (
          <>
            <SummaryCard label={t("finance.classIncome")} value={summary.class_income} tone="success" />
            <SummaryCard label={t("finance.paid")} value={summary.paid_amount} />
            <SummaryCard label={t("finance.mofReceivable")} value={summary.mof_receivable} tone="warning" />
            <SummaryCard label={t("finance.otherReceivable")} value={summary.other_receivable} tone="info" />
            <SummaryCard label={t("finance.refunds")} value={summary.refund_amount} />
            <SummaryCard label={t("finance.irrecoverable")} value={summary.irrecoverable_debt} tone="danger" />
            <SummaryCard label={t("finance.netReceivable")} value={summary.net_receivable} tone="warning" />
            <SummaryCard label={t("finance.totalIncome")} value={summary.total_income} tone="success" />
          </>
        ) : (
          <>
            <SummaryCard label={t("finance.courseIncome")} value={summary.course_income} tone="success" />
            <SummaryCard label={t("finance.totalIncome")} value={summary.total_income} />
          </>
        )}
      </div>

      {module === "class" ? (
        <DataTable
          data={rows as FinanceClassRow[]}
          config={classConfig}
          params={params}
          onParamsChange={updateParams}
          pagination={pagination}
          isLoading={isLoading}
        />
      ) : (
        <DataTable
          data={rows as FinanceCourseRow[]}
          config={courseConfig}
          params={params}
          onParamsChange={updateParams}
          pagination={pagination}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default FinanceReportPage;
