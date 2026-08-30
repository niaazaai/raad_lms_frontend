import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  PageBreadcrumb,
  SearchableMultiSelect,
  SearchableSelect,
} from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDebounce } from "@/hooks/common/useDebounce";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "@/modules/Course/components/ClassStudentPaymentForm";
import { useCourseEntityList, getCourseListFromResponse } from "@/modules/Course/hooks/useCourseEntity";
import { extractStudentEnrollments, useStudentActiveEnrollments } from "../../hooks/useReceivePayment";
import {
  extractManualInvoice,
  extractNextInvoiceNumber,
  useCreateManualInvoice,
  useNextManualInvoiceNumber,
} from "../../hooks/useManualInvoice";
import type { FinanceInvoiceRow, FinanceTransaction } from "../../data/models/FinanceReport";

interface LastCreatedManualInvoice {
  invoiceNumber: string;
  transactionId: number;
  transactionDate: string;
  pdfUrl?: string | null;
  amount?: number | string | null;
  currency?: string | null;
}

const notesTextareaClass = cn(
  "flex w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "md:text-sm resize-y",
);

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatStudentPickerLabel(student: Record<string, unknown>): { value: string; label: string } {
  const name = `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "—";
  const code = String(student.student_code ?? student.id);
  const nationalId = String(student.national_id ?? "—");
  const phone = String(student.phone_number ?? "").trim();
  const phoneSuffix = phone ? ` · ${phone}` : "";
  return {
    value: String(student.id),
    label: `${code} - ${name} : ${nationalId}${phoneSuffix}`,
  };
}

function formatDisplayDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function lastCreatedFromInvoice(invoice: FinanceInvoiceRow): LastCreatedManualInvoice | null {
  const transaction = invoice.transaction as FinanceTransaction | undefined;
  if (!transaction?.id) return null;

  return {
    invoiceNumber: invoice.invoice_number,
    transactionId: transaction.id,
    transactionDate: transaction.transaction_date ?? "",
    pdfUrl: invoice.pdf_url,
    amount: invoice.amount,
    currency: invoice.currency ?? undefined,
  };
}

function formatMoney(value: unknown, currency?: string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency ?? "AFN"}`;
}

const ManualInvoicePage = () => {
  const { t } = useTranslation();
  const { hasAnyPermission } = useAuth();
  const canCreate = hasAnyPermission([
    "course.class_students.invoice",
    "course.class_students.payment",
    "course.class_students.update",
  ]);

  const [studentId, setStudentId] = useState<number | null>(null);
  const [selectedStudentLabel, setSelectedStudentLabel] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const debouncedStudentSearch = useDebounce(studentSearchQuery, 300);
  const studentSearchTerm = debouncedStudentSearch.trim();
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("AFN");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [transactionDate, setTransactionDate] = useState(todayIsoDate());
  const [customerName, setCustomerName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [lastCreated, setLastCreated] = useState<LastCreatedManualInvoice | null>(null);

  const createManualInvoice = useCreateManualInvoice();
  const nextNumberQuery = useNextManualInvoiceNumber(canCreate);
  const nextInvoiceNumber = extractNextInvoiceNumber(nextNumberQuery.data);

  const studentsListQuery = useCourseEntityList(
    "lms-class-students",
    {
      per_page: 25,
      page: 1,
      status: "active",
      picker: 1,
      search: studentSearchTerm || undefined,
    },
    { enabled: studentSearchTerm.length >= 1, keepPreviousData: true },
  );

  const availableStudents = getCourseListFromResponse(studentsListQuery.data);
  const studentOptions = useMemo(() => {
    const fromSearch = availableStudents.map((s) => formatStudentPickerLabel(s));
    if (studentId && selectedStudentLabel && !fromSearch.some((o) => o.value === String(studentId))) {
      return [{ value: String(studentId), label: selectedStudentLabel }, ...fromSearch];
    }
    return fromSearch;
  }, [availableStudents, selectedStudentLabel, studentId]);

  const enrollmentsQuery = useStudentActiveEnrollments(studentId);
  const enrollments = extractStudentEnrollments(enrollmentsQuery.data);

  const enrollmentOptions = useMemo(
    () =>
      enrollments.map((row) => ({
        value: String(row.id),
        label: `${row.class_name || t("finance.receivePayment.unknownClass")}${row.class_code ? ` (${row.class_code})` : ""}`,
      })),
    [enrollments, t],
  );

  const needsExchangeRate = currency === "USD" || currency === "GBP";

  const handleStudentChange = useCallback(
    (ids: string[]) => {
      const value = ids[0] ?? "";
      const nextId = value ? Number(value) : null;
      setStudentId(Number.isNaN(nextId) ? null : nextId);
      const match = studentOptions.find((o) => o.value === value);
      setSelectedStudentLabel(match?.label ?? "");
      setEnrollmentId(null);
    },
    [studentOptions],
  );

  const resetForm = () => {
    setAmount("");
    setCustomerName("");
    setServiceName("");
    setCost("");
    setNotes("");
    setTransactionDate(todayIsoDate());
    setExchangeRate("1");
    setCurrency("AFN");
    setStudentId(null);
    setSelectedStudentLabel("");
    setEnrollmentId(null);
    setStudentSearchQuery("");
    void nextNumberQuery.refetch();
  };

  const handleSubmit = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error(t("finance.manualInvoice.amountRequired"));
      return;
    }

    const payload = {
      amount: parsedAmount,
      currency,
      exchange_rate: needsExchangeRate ? Number(exchangeRate) || 1 : 1,
      transaction_date: transactionDate,
      customer_name: customerName.trim() || undefined,
      service_name: serviceName.trim() || undefined,
      cost: cost.trim() ? Number(cost) : undefined,
      notes: notes.trim() || undefined,
      ...(enrollmentId ? { class_student_id: enrollmentId } : {}),
    };

    try {
      const response = await createManualInvoice.mutateAsync(payload);
      const invoice = extractManualInvoice(response);
      const created = invoice ? lastCreatedFromInvoice(invoice) : null;
      toast.success(t("finance.manualInvoice.success"));
      if (created) {
        setLastCreated(created);
      }
      if (invoice?.pdf_url) {
        window.open(invoice.pdf_url, "_blank", "noopener,noreferrer");
      }
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("finance.manualInvoice.error"));
    }
  };

  if (!canCreate) {
    return <PermissionDeniedCard />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-6 p-6 pb-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("finance.manualInvoice.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("finance.manualInvoice.subtitle")}</p>
            <div className="mt-2">
              <PageBreadcrumb
                items={[
                  { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                  { label: t("finance.title"), to: "/finance" },
                  { label: t("finance.manualInvoices.title"), to: "/finance/manual-invoices" },
                  { label: t("finance.manualInvoice.title") },
                ]}
              />
            </div>
          </div>
          <Button type="button" variant="outline" asChild>
            <Link to="/finance/manual-invoices">{t("finance.manualInvoices.title")}</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 justify-center p-6">
        <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_280px]">
          <Card>
            <CardContent className="space-y-4 p-6">
              <SearchableMultiSelect
                label={t("finance.manualInvoice.studentOptional")}
                options={studentOptions}
                value={studentId ? [String(studentId)] : []}
                onChange={handleStudentChange}
                placeholder={t("finance.receivePayment.studentPlaceholder")}
                searchPlaceholder={t("finance.receivePayment.studentSearch")}
                emptyMessage={t("finance.receivePayment.studentEmpty")}
                typeToSearchMessage={t("course.classStudents.typeToSearchStudents")}
                filterLocally={false}
                onSearchChange={setStudentSearchQuery}
                isSearching={studentsListQuery.isFetching}
                minSearchLength={1}
                max={1}
              />

              {studentId ? (
                <div className="space-y-1.5">
                  <Label>{t("finance.manualInvoice.classOptional")}</Label>
                  {enrollmentsQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
                  ) : enrollmentOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("finance.receivePayment.noEnrollments")}</p>
                  ) : (
                    <SearchableSelect
                      options={enrollmentOptions}
                      value={enrollmentId ? String(enrollmentId) : ""}
                      onChange={(value) => setEnrollmentId(value ? Number(value) : null)}
                      placeholder={t("finance.receivePayment.classPlaceholder")}
                      searchPlaceholder={t("finance.receivePayment.classSearch")}
                      emptyMessage={t("finance.receivePayment.classEmpty")}
                    />
                  )}
                </div>
              ) : null}

              <div className={cn("grid gap-4", needsExchangeRate ? "grid-cols-3" : "grid-cols-2")}>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="manual-amount">{t("finance.manualInvoice.amount")}</Label>
                  <Input
                    id="manual-amount"
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="manual-currency">{t("finance.manualInvoice.currency")}</Label>
                  <SearchableSelect
                    options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                    value={currency}
                    onChange={(value) => {
                      setCurrency(value || "AFN");
                      if (value === "AFN") setExchangeRate("1");
                    }}
                    placeholder={t("finance.manualInvoice.currency")}
                  />
                </div>
                {needsExchangeRate ? (
                  <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="manual-fx">{t("finance.manualInvoice.exchangeRate")}</Label>
                    <Input
                      id="manual-fx"
                      type="number"
                      min={0.0001}
                      step="0.0001"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="manual-customer">{t("finance.manualInvoice.customerName")}</Label>
                <Input
                  id="manual-customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t("finance.manualInvoice.customerPlaceholder")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="manual-service">{t("finance.manualInvoice.serviceName")}</Label>
                <Input
                  id="manual-service"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder={t("finance.manualInvoice.servicePlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="manual-cost">{t("finance.manualInvoice.serviceCost")}</Label>
                  <Input
                    id="manual-cost"
                    type="number"
                    min={0}
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="manual-date">{t("finance.manualInvoice.date")}</Label>
                  <Input
                    id="manual-date"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="manual-notes">{t("finance.manualInvoice.internalNote")}</Label>
                <textarea
                  id="manual-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={notesTextareaClass}
                  style={{ height: 150 }}
                />
              </div>

              <Button type="button" onClick={handleSubmit} disabled={createManualInvoice.isPending}>
                {createManualInvoice.isPending ? t("common.loading") : t("finance.manualInvoice.submit")}
              </Button>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("finance.manualInvoice.totalCard")}
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-success">{formatMoney(amount || 0, currency)}</p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("finance.manualInvoice.nextInvoiceNumber")}
                </p>
                <p className="mt-1.5 font-mono text-lg font-semibold text-foreground">
                  {nextNumberQuery.isLoading ? "…" : nextInvoiceNumber || "—"}
                </p>
              </div>
              {serviceName.trim() ? (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("finance.manualInvoice.serviceName")}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-foreground">{serviceName.trim()}</p>
                </div>
              ) : null}
              {lastCreated ? (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("finance.manualInvoice.createdInvoice")}
                  </p>
                  <p className="mt-1.5 font-mono text-lg font-semibold text-foreground">{lastCreated.invoiceNumber}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("finance.manualInvoice.transactionNumber")}{" "}
                    <span className="font-mono font-medium text-foreground">{lastCreated.transactionId}</span>
                  </p>
                  {lastCreated.transactionDate ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("finance.manualInvoice.date")}:{" "}
                      <span className="font-medium text-foreground">
                        {formatDisplayDate(lastCreated.transactionDate)}
                      </span>
                    </p>
                  ) : null}
                  {lastCreated.pdfUrl ? (
                    <Button type="button" variant="outline" size="sm" className="mt-3 w-full" asChild>
                      <a href={lastCreated.pdfUrl} target="_blank" rel="noopener noreferrer">
                        {t("finance.manualInvoice.viewPdf")}
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <p className="text-sm text-muted-foreground">{t("finance.manualInvoice.totalHint")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManualInvoicePage;
