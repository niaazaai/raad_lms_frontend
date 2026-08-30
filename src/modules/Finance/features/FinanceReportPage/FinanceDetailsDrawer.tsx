import type { ReactNode } from "react";
import { Book, Calendar, Hat, Page, User, Wallet } from "iconoir-react";
import {
  Button,
  Card,
  CardContent,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  Spinner,
} from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import {
  extractEnrollmentTransactions,
  useEnrollmentTransactions,
} from "../../hooks/useEnrollmentTransactions";
import type {
  FinanceClassRow,
  FinanceCourseRow,
  FinanceModule,
  FinanceTransaction,
} from "../../data/models/FinanceReport";

function formatMoney(value: unknown, currency?: string | null): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return currency ? `${formatted} ${currency}` : formatted;
}

function display(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function StatusBadge({ value, label }: { value?: string | null; label?: string | null }) {
  const raw = String(value ?? "");
  const colors: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    paid: "bg-success/10 text-success",
    partial: "bg-info/10 text-info",
    mof_pending: "bg-auxiliary/10 text-auxiliary",
    other_party: "bg-info/10 text-info",
    failed: "bg-danger/10 text-danger",
    refunded: "bg-muted text-muted-foreground",
    payment: "bg-success/10 text-success",
    refund: "bg-danger/10 text-danger",
    receivable: "bg-warning/10 text-warning",
    active: "bg-success/10 text-success",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", colors[raw] ?? "bg-muted text-muted-foreground")}>
      {label || raw || "—"}
    </span>
  );
}

interface DetailFieldProps {
  label: string;
  value: ReactNode;
}

const DetailField = ({ label, value }: DetailFieldProps) => (
  <div className="min-w-0 space-y-1">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="text-sm font-medium text-foreground">{value}</div>
  </div>
);

interface SectionCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

const SectionCard = ({ icon, title, children }: SectionCardProps) => (
  <Card className="h-full shadow-none">
    <CardContent className="space-y-5 p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </CardContent>
  </Card>
);

interface FinanceDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  module: FinanceModule;
  classRow?: FinanceClassRow | null;
  courseRow?: FinanceCourseRow | null;
}

const FinanceDetailsDrawer = ({ open, onClose, module, classRow, courseRow }: FinanceDetailsDrawerProps) => {
  const { t } = useTranslation();
  const enrollmentId = module === "class" && classRow ? classRow.id : null;
  const transactionsQuery = useEnrollmentTransactions(open ? enrollmentId : null);
  const transactions = extractEnrollmentTransactions(transactionsQuery.data);

  const studentName = module === "class" ? classRow?.student_name : courseRow?.student_name;
  const subjectName = module === "class" ? classRow?.class_name : courseRow?.course_title;
  const instructorName = module === "class" ? classRow?.teacher_name : courseRow?.instructor_name;
  const currency = classRow?.currency ?? "AFN";

  const openInvoice = (url?: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent side="right" className="w-[70vw] min-w-0 max-w-none">
        <DrawerHeader>
          <div className="space-y-1.5 pe-4">
            <div className="flex flex-wrap items-center gap-3">
              <DrawerTitle>{t("finance.details.title")}</DrawerTitle>
              {module === "class" ? (
                <StatusBadge value={classRow?.payment_status} label={classRow?.payment_status_label} />
              ) : (
                <StatusBadge value={courseRow?.payment_status} label={courseRow?.payment_status_label} />
              )}
            </div>
            <DrawerDescription>
              {module === "class" ? t("finance.details.subtitleClass") : t("finance.details.subtitleCourse")}
            </DrawerDescription>
            {studentName || subjectName ? (
              <p className="text-sm text-foreground">
                <span className="font-semibold">{studentName || "—"}</span>
                {subjectName ? <span className="text-muted-foreground"> · {subjectName}</span> : null}
              </p>
            ) : null}
          </div>
        </DrawerHeader>

        <DrawerBody className="space-y-8 px-8 py-6">
          <section className="grid gap-4 lg:grid-cols-3">
            <SectionCard icon={<User className="h-4 w-4" />} title={t("finance.details.student")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailField label={t("finance.details.student")} value={display(studentName)} />
                {module === "class" ? (
                  <>
                    <DetailField label={t("finance.details.studentCode")} value={display(classRow?.student_code)} />
                    <DetailField label={t("finance.details.fatherName")} value={display(classRow?.father_name)} />
                    <DetailField label={t("finance.details.phone")} value={display(classRow?.phone_number)} />
                    <DetailField label={t("finance.details.nationalId")} value={display(classRow?.national_id)} />
                    <DetailField label={t("finance.details.email")} value={display(classRow?.email)} />
                  </>
                ) : (
                  <DetailField label={t("finance.details.email")} value={display(courseRow?.student_email)} />
                )}
              </div>
            </SectionCard>

            <SectionCard
              icon={<Book className="h-4 w-4" />}
              title={module === "class" ? t("finance.details.class") : t("finance.details.course")}
            >
              {module === "class" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label={t("finance.details.class")} value={display(classRow?.class_name)} />
                  <DetailField label={t("finance.details.classCode")} value={display(classRow?.class_code)} />
                  <DetailField
                    label={t("finance.details.classDates")}
                    value={
                      classRow?.starting_date || classRow?.ending_date
                        ? `${classRow?.starting_date || "—"} – ${classRow?.ending_date || "—"}`
                        : "—"
                    }
                  />
                  <DetailField label={t("finance.details.schedule")} value={display(classRow?.schedule_days_label)} />
                  <DetailField label={t("finance.details.timing")} value={display(classRow?.timing)} />
                  <DetailField
                    label={t("finance.columns.classStatus")}
                    value={display(classRow?.class_status_label || classRow?.class_status)}
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label={t("finance.details.course")} value={display(courseRow?.course_title)} />
                  <DetailField label={t("finance.details.plan")} value={display(courseRow?.plan_name)} />
                  <DetailField
                    label={t("finance.details.subscriptionId")}
                    value={display(courseRow?.subscription_public_id)}
                  />
                  <DetailField
                    label={t("finance.details.subscriptionPeriod")}
                    value={
                      courseRow?.subscription_start_date || courseRow?.subscription_end_date
                        ? `${courseRow?.subscription_start_date || "—"} – ${courseRow?.subscription_end_date || "—"}`
                        : "—"
                    }
                  />
                  <DetailField
                    label={t("finance.columns.subscriptionStatus")}
                    value={display(courseRow?.subscription_status_label || courseRow?.subscription_status)}
                  />
                  <DetailField label={t("finance.details.purchaseDate")} value={display(courseRow?.purchase_date)} />
                </div>
              )}
            </SectionCard>

            <SectionCard icon={<Hat className="h-4 w-4" />} title={t("finance.details.instructor")}>
              <div className="grid gap-4">
                <DetailField label={t("finance.details.instructor")} value={display(instructorName)} />
                {module === "class" ? (
                  <DetailField
                    label={t("finance.details.enrollmentDate")}
                    value={display(classRow?.enrollment_date)}
                  />
                ) : (
                  <DetailField
                    label={t("finance.details.planDuration")}
                    value={
                      courseRow?.plan_duration_days
                        ? `${courseRow.plan_duration_days} ${t("finance.details.days")}`
                        : "—"
                    }
                  />
                )}
              </div>
            </SectionCard>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-semibold text-foreground">{t("finance.details.financialSummary")}</h3>
            </div>
            {module === "class" && classRow ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryTile label={t("finance.columns.fees")} value={formatMoney(classRow.fees_amount, currency)} />
                <SummaryTile label={t("finance.columns.discountAmount")} value={formatMoney(classRow.discount_amount, currency)} />
                <SummaryTile label={t("finance.columns.net")} value={formatMoney(classRow.net_amount, currency)} />
                <SummaryTile label={t("finance.columns.paid")} value={formatMoney(classRow.paid_amount, currency)} tone="success" />
                <SummaryTile label={t("finance.columns.refund")} value={formatMoney(classRow.refund_amount, currency)} />
                <SummaryTile label={t("finance.columns.mof")} value={formatMoney(classRow.mof_receivable_amount, currency)} tone="warning" />
                <SummaryTile label={t("finance.columns.other")} value={formatMoney(classRow.other_receivable_amount, currency)} />
                <SummaryTile label={t("finance.columns.netReceivable")} value={formatMoney(classRow.net_receivable, currency)} tone="warning" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <SummaryTile label={t("finance.columns.amount")} value={formatMoney(courseRow?.amount)} tone="success" />
                <SummaryTile label={t("finance.columns.paymentStatus")} value={courseRow?.payment_status_label || courseRow?.payment_status || "—"} />
                <SummaryTile label={t("finance.columns.purchaseDate")} value={display(courseRow?.purchase_date)} />
              </div>
            )}
          </section>

          {module === "class" ? (
            <section className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">{t("finance.details.transactions")}</h3>
              </div>
              <Card className="shadow-none">
                <CardContent className="p-0">
                  {transactionsQuery.isLoading ? (
                    <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted-foreground">
                      <Spinner className="h-4 w-4" />
                      {t("finance.details.loading")}
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                      {t("finance.details.noTransactions")}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead>
                          <tr className="border-b border-border text-start text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="px-5 py-3 font-medium">{t("finance.details.type")}</th>
                            <th className="px-5 py-3 font-medium">{t("finance.details.date")}</th>
                            <th className="px-5 py-3 text-end font-medium">{t("finance.details.amount")}</th>
                            <th className="px-5 py-3 font-medium">{t("finance.columns.nextInstallment")}</th>
                            <th className="px-5 py-3 font-medium">{t("finance.details.invoice")}</th>
                            <th className="px-5 py-3 font-medium">{t("finance.details.notes")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx) => (
                            <TransactionRow
                              key={tx.id}
                              transaction={tx}
                              onOpenInvoice={openInvoice}
                              openInvoiceLabel={t("finance.details.openInvoice")}
                              noInvoiceLabel={t("finance.details.noInvoice")}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          ) : null}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

interface SummaryTileProps {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}

const SummaryTile = ({ label, value, tone = "default" }: SummaryTileProps) => {
  const tones = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
  };
  return (
    <Card className="shadow-none">
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("mt-1.5 text-base font-semibold tabular-nums", tones[tone])}>{value}</p>
      </CardContent>
    </Card>
  );
};

interface TransactionRowProps {
  transaction: FinanceTransaction;
  onOpenInvoice: (url?: string | null) => void;
  openInvoiceLabel: string;
  noInvoiceLabel: string;
}

const TransactionRow = ({
  transaction,
  onOpenInvoice,
  openInvoiceLabel,
  noInvoiceLabel,
}: TransactionRowProps) => {
  const invoice = transaction.invoice;
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-5 py-3.5">
        <StatusBadge value={transaction.type} label={transaction.type_label} />
      </td>
      <td className="px-5 py-3.5 text-foreground">{display(transaction.transaction_date)}</td>
      <td className="px-5 py-3.5 text-end font-medium tabular-nums text-foreground">
        {formatMoney(transaction.amount, transaction.currency)}
      </td>
      <td className="px-5 py-3.5 text-foreground">{display(transaction.next_installment_date)}</td>
      <td className="px-5 py-3.5">
        {invoice?.pdf_url ? (
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenInvoice(invoice.pdf_url)}>
            <Page className="h-4 w-4" />
            <span className="font-mono text-xs">{invoice.invoice_number}</span>
            <span className="sr-only">{openInvoiceLabel}</span>
          </Button>
        ) : (
          <span className="text-muted-foreground">{noInvoiceLabel}</span>
        )}
      </td>
      <td className="max-w-[220px] truncate px-5 py-3.5 text-muted-foreground">{display(transaction.notes)}</td>
    </tr>
  );
};

export default FinanceDetailsDrawer;
