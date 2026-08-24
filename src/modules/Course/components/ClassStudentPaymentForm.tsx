import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import type { ClassStudentRow } from "../hooks/useClassStudents";

export const DISCOUNT_TYPES = ["none", "percentage", "fixed"] as const;
export const CURRENCIES = ["AFN", "USD", "GBP"] as const;
export const RECEIVABLE_STATUSES = ["pending", "mof_pending", "other_party"] as const;

export type PaymentFormState = {
  discount_type: string;
  discount_amount: string;
  payment_amount: string;
  currency: string;
  exchange_rate: string;
  next_due_date: string;
  transaction_date: string;
  receivable_status: string;
  other_party_name: string;
  irrecoverable_debt: string;
};

export function defaultPaymentFormState(): PaymentFormState {
  return {
    discount_type: "none",
    discount_amount: "",
    payment_amount: "",
    currency: "AFN",
    exchange_rate: "1",
    next_due_date: "",
    transaction_date: new Date().toISOString().slice(0, 10),
    receivable_status: "pending",
    other_party_name: "",
    irrecoverable_debt: "",
  };
}

export function resolveEnrollmentRemainingDue(
  enrollment: Pick<
    ClassStudentRow,
    | "due_amount"
    | "class_fee"
    | "discount_type"
    | "discount_amount"
    | "paid_amount"
    | "irrecoverable_debt"
  >,
  classFee = 0,
): number {
  if (enrollment.due_amount != null && enrollment.due_amount !== "") {
    const due = Number(enrollment.due_amount);
    if (!Number.isNaN(due)) {
      return Math.max(0, Math.round(due * 100) / 100);
    }
  }

  const feeSource = enrollment.class_fee != null ? Number(enrollment.class_fee) : classFee;
  const discountType = String(enrollment.discount_type ?? "none");
  const discountAmount = enrollment.discount_amount != null ? Number(enrollment.discount_amount) : 0;
  const alreadyPaid = Number(enrollment.paid_amount ?? 0);
  const irrecoverable = Number(enrollment.irrecoverable_debt ?? 0);
  const feeAfter = computeFeeAfterDiscount(feeSource, discountType, discountAmount);

  return Math.max(0, Math.round((feeAfter - alreadyPaid - irrecoverable) * 100) / 100);
}

export function isEnrollmentFullyPaid(
  enrollment: Pick<
    ClassStudentRow,
    | "payment_status"
    | "due_amount"
    | "class_fee"
    | "discount_type"
    | "discount_amount"
    | "paid_amount"
    | "irrecoverable_debt"
  >,
  classFee = 0,
): boolean {
  if (String(enrollment.payment_status ?? "") === "paid") {
    return true;
  }

  return resolveEnrollmentRemainingDue(enrollment, classFee) <= 0.009;
}

export function buildPaymentFormStateFromEnrollment(
  enrollment: Pick<
    ClassStudentRow,
    | "due_amount"
    | "class_fee"
    | "discount_type"
    | "discount_amount"
    | "paid_amount"
    | "payment_status"
    | "currency"
    | "next_due_date"
    | "other_party_name"
    | "irrecoverable_debt"
  >,
  classFee = 0,
): PaymentFormState {
  const discountType = String(enrollment.discount_type ?? "none");
  const discountAmount = enrollment.discount_amount != null ? Number(enrollment.discount_amount) : 0;
  const irrecoverable = Number(enrollment.irrecoverable_debt ?? 0);
  const remaining = resolveEnrollmentRemainingDue(enrollment, classFee);
  const currentStatus = String(enrollment.payment_status ?? "pending");
  const receivableStatus = RECEIVABLE_STATUSES.includes(currentStatus as (typeof RECEIVABLE_STATUSES)[number])
    ? currentStatus
    : "pending";

  return {
    discount_type: discountType,
    discount_amount: String(discountAmount),
    payment_amount: remaining > 0 ? String(remaining) : "",
    currency: String(enrollment.currency ?? "AFN"),
    exchange_rate: "1",
    next_due_date: enrollment.next_due_date ? String(enrollment.next_due_date).slice(0, 10) : "",
    transaction_date: new Date().toISOString().slice(0, 10),
    receivable_status: receivableStatus,
    other_party_name: String(enrollment.other_party_name ?? ""),
    irrecoverable_debt: irrecoverable > 0 ? String(irrecoverable) : "",
  };
}

export function formatMoney(value: unknown): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function computeFeeAfterDiscount(classFee: number, discountType: string, discountAmount: number): number {
  if (discountType === "percentage") {
    return Math.max(0, Math.round(classFee * (1 - Math.min(100, Math.max(0, discountAmount)) / 100) * 100) / 100);
  }
  if (discountType === "fixed") {
    return Math.max(0, Math.round((classFee - Math.max(0, discountAmount)) * 100) / 100);
  }
  return Math.max(0, classFee);
}

export function resolvePaymentPreviewStatus(
  fee: number,
  paid: number,
  receivableStatus?: string,
): "pending" | "paid" | "partial" | "mof_pending" | "other_party" {
  if (fee <= 0 || paid >= fee) return "paid";
  if (receivableStatus === "mof_pending") return "mof_pending";
  if (receivableStatus === "other_party") return "other_party";
  if (paid <= 0) return "pending";
  return "partial";
}

function PaymentStatusBadge({ value }: { value: unknown }) {
  const { t } = useTranslation();
  const raw = String(value ?? "pending");
  const labels: Record<string, string> = {
    pending: t("course.paymentStatus.pending"),
    paid: t("course.paymentStatus.paid"),
    partial: t("course.paymentStatus.partial"),
    mof_pending: t("course.paymentStatus.mof_pending"),
    other_party: t("course.paymentStatus.other_party"),
  };
  const colors: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    paid: "bg-success/10 text-success",
    partial: "bg-info/10 text-info",
    mof_pending: "bg-auxiliary/10 text-auxiliary",
    other_party: "bg-info/10 text-info",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[raw] ?? "bg-muted text-muted-foreground")}>
      {labels[raw] ?? raw}
    </span>
  );
}

export interface ClassStudentPaymentFormProps {
  enrollment: Pick<
    ClassStudentRow,
    "paid_amount" | "class_fee" | "currency" | "discount_type" | "discount_amount" | "irrecoverable_debt"
  >;
  classFee: number;
  form: PaymentFormState;
  onFormChange: (next: PaymentFormState) => void;
  onSubmit: () => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  classifyOnlyLabel?: string;
}

export function ClassStudentPaymentForm({
  enrollment,
  classFee,
  form,
  onFormChange,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  classifyOnlyLabel,
}: ClassStudentPaymentFormProps) {
  const { t } = useTranslation();

  const feeSource = enrollment.class_fee != null ? Number(enrollment.class_fee) : classFee;
  const discountAmount = form.discount_amount ? Number(form.discount_amount) : 0;
  const paymentAmount = form.payment_amount ? Number(form.payment_amount) : 0;
  const alreadyPaid = Number(enrollment.paid_amount ?? 0);
  const irrecoverable = form.irrecoverable_debt ? Number(form.irrecoverable_debt) : 0;
  const feeAfterDiscount = computeFeeAfterDiscount(feeSource, form.discount_type, discountAmount);
  const remainingBefore = Math.max(0, Math.round((feeAfterDiscount - alreadyPaid - irrecoverable) * 100) / 100);
  const projectedPaid = alreadyPaid + paymentAmount;
  const dueAfter = Math.max(0, Math.round((feeAfterDiscount - projectedPaid - irrecoverable) * 100) / 100);
  const previewStatus = resolvePaymentPreviewStatus(
    feeAfterDiscount - irrecoverable,
    projectedPaid,
    dueAfter > 0.009 ? form.receivable_status : undefined,
  );
  const needsExchangeRate = form.currency === "USD" || form.currency === "GBP";
  const needsNextDue = dueAfter > 0.009 && form.receivable_status === "pending";
  const otherPartyOk = form.receivable_status !== "other_party" || form.other_party_name.trim() !== "";
  const canSubmit =
    otherPartyOk &&
    paymentAmount <= remainingBefore + 0.01 &&
    (paymentAmount > 0 || (dueAfter > 0.009 && (form.receivable_status === "mof_pending" || form.receivable_status === "other_party")));

  const applyDiscountChange = (next: Partial<PaymentFormState>) => {
    const merged = { ...form, ...next };
    const nextDiscountAmount = merged.discount_amount ? Number(merged.discount_amount) : 0;
    const nextFee = computeFeeAfterDiscount(feeSource, merged.discount_type, nextDiscountAmount);
    const nextRemaining = Math.max(0, Math.round((nextFee - alreadyPaid - irrecoverable) * 100) / 100);
    onFormChange({
      ...merged,
      payment_amount: nextRemaining > 0 ? String(nextRemaining) : "",
      next_due_date: nextRemaining > 0 ? merged.next_due_date : "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("course.classStudents.courseFee")}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums">
          {formatMoney(feeSource)}{" "}
          <span className="text-sm font-medium text-muted-foreground">{form.currency || "AFN"}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("course.classStudents.discountType")}</Label>
          <Select
            value={form.discount_type}
            onValueChange={(v) =>
              applyDiscountChange({
                discount_type: v,
                discount_amount: v === "none" ? "0" : form.discount_amount,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISCOUNT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`course.discountType.${type}` as "course.discountType.none")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discount-amount">{t("course.classStudents.discountAmount")}</Label>
          <Input
            id="discount-amount"
            type="number"
            min={0}
            max={form.discount_type === "percentage" ? 100 : undefined}
            disabled={form.discount_type === "none"}
            value={form.discount_type === "none" ? "0" : form.discount_amount}
            onChange={(e) => applyDiscountChange({ discount_amount: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="payment-amount">{t("course.classStudents.paymentAmount")}</Label>
          <Input
            id="payment-amount"
            type="number"
            min={0}
            max={remainingBefore || undefined}
            value={form.payment_amount}
            onChange={(e) => onFormChange({ ...form, payment_amount: e.target.value })}
            disabled={remainingBefore <= 0}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("course.classStudents.currency")}</Label>
          <Select
            value={form.currency}
            onValueChange={(v) =>
              onFormChange({
                ...form,
                currency: v,
                exchange_rate: v === "AFN" ? "1" : form.exchange_rate || "1",
              })
            }
          >
            <SelectTrigger className="w-[6.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {needsExchangeRate ? (
        <div className="space-y-1.5">
          <Label htmlFor="exchange-rate">{t("course.classStudents.exchangeRate")}</Label>
          <Input
            id="exchange-rate"
            type="number"
            min={0.0001}
            step="0.0001"
            value={form.exchange_rate}
            onChange={(e) => onFormChange({ ...form, exchange_rate: e.target.value })}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="transaction-date">{t("course.classStudents.transactionDate")}</Label>
        <Input
          id="transaction-date"
          type="date"
          value={form.transaction_date}
          onChange={(e) => onFormChange({ ...form, transaction_date: e.target.value })}
        />
      </div>

      {needsNextDue ? (
        <div className="space-y-1.5">
          <Label htmlFor="next-due-date">{t("course.classStudents.nextDueDate")}</Label>
          <Input
            id="next-due-date"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={form.next_due_date}
            onChange={(e) => onFormChange({ ...form, next_due_date: e.target.value })}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label>{t("course.classStudents.receivable")}</Label>
        <Select value={form.receivable_status} onValueChange={(v) => onFormChange({ ...form, receivable_status: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECEIVABLE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`course.paymentStatus.${status}` as "course.paymentStatus.pending")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t("course.classStudents.receivableHint")}</p>
      </div>

      {form.receivable_status === "other_party" ? (
        <div className="space-y-1.5">
          <Label htmlFor="other-party-name">{t("course.classStudents.otherPartyName")}</Label>
          <Input
            id="other-party-name"
            value={form.other_party_name}
            onChange={(e) => onFormChange({ ...form, other_party_name: e.target.value })}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="irrecoverable-debt">{t("course.classStudents.irrecoverableDebt")}</Label>
        <Input
          id="irrecoverable-debt"
          type="number"
          min={0}
          value={form.irrecoverable_debt}
          onChange={(e) => onFormChange({ ...form, irrecoverable_debt: e.target.value })}
        />
      </div>

      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t("course.classStudents.afterDiscount")}</span>
          <span className="font-medium tabular-nums">
            {formatMoney(feeAfterDiscount)} {form.currency}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t("course.classStudents.alreadyPaid")}</span>
          <span className="font-medium tabular-nums">
            {formatMoney(alreadyPaid)} {form.currency}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{t("course.columns.payment_status")}</span>
          <PaymentStatusBadge value={previewStatus} />
        </div>
        {previewStatus === "partial" ||
        previewStatus === "pending" ||
        previewStatus === "mof_pending" ||
        previewStatus === "other_party" ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{t("course.columns.due_amount")}</span>
            <span className="font-medium tabular-nums text-warning">
              {formatMoney(dueAfter)} {form.currency}
            </span>
          </div>
        ) : null}
        {remainingBefore <= 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">{t("course.classStudents.fullyPaidHint")}</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          loading={isSubmitting}
          disabled={!canSubmit || (needsNextDue && !form.next_due_date)}
          onClick={() => void onSubmit()}
        >
          {paymentAmount > 0
            ? submitLabel ?? t("course.classStudents.savePayment")
            : classifyOnlyLabel ?? t("course.classStudents.classifyOnly")}
        </Button>
      </div>
    </div>
  );
}

export function buildPaymentPayloadFromForm(
  form: PaymentFormState,
  enrollment: Pick<ClassStudentRow, "paid_amount" | "class_fee">,
  classFee: number,
) {
  const discountAmount = form.discount_amount ? Number(form.discount_amount) : 0;
  const paymentAmount = form.payment_amount ? Number(form.payment_amount) : 0;
  const irrecoverable = form.irrecoverable_debt ? Number(form.irrecoverable_debt) : 0;
  const needsExchangeRate = form.currency === "USD" || form.currency === "GBP";
  const feeSource = enrollment.class_fee != null ? Number(enrollment.class_fee) : classFee;
  const feeAfterDiscount = computeFeeAfterDiscount(feeSource, form.discount_type, discountAmount);
  const alreadyPaid = Number(enrollment.paid_amount ?? 0);
  const projectedPaid = alreadyPaid + paymentAmount;
  const dueAfter = Math.max(0, Math.round((feeAfterDiscount - projectedPaid - irrecoverable) * 100) / 100);
  const needsNextDue = dueAfter > 0.009 && form.receivable_status === "pending";

  return {
    discount_type: form.discount_type,
    discount_amount: form.discount_type === "none" ? 0 : discountAmount,
    payment_amount: paymentAmount,
    currency: form.currency,
    exchange_rate: needsExchangeRate ? Number(form.exchange_rate || 1) : 1,
    transaction_date: form.transaction_date || undefined,
    next_due_date: needsNextDue ? form.next_due_date || null : null,
    receivable_status: form.receivable_status,
    other_party_name: form.receivable_status === "other_party" ? form.other_party_name.trim() : undefined,
    irrecoverable_debt: irrecoverable,
  };
}
