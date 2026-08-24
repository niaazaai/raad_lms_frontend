export type FinanceModule = "class" | "course";
export type FinancePeriod = "daily" | "monthly" | "yearly" | "range";

export interface FinanceSummary {
  class_income: number;
  course_income: number;
  total_income: number;
  fees_amount: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  refund_amount: number;
  mof_receivable: number;
  other_receivable: number;
  irrecoverable_debt: number;
  net_receivable: number;
}

export interface FinancePeriodMeta {
  type: FinancePeriod;
  from: string;
  to: string;
}

export interface FinanceClassRow {
  id: number;
  student_name?: string | null;
  father_name?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  invoice_number?: string | null;
  schedule_days?: string | null;
  schedule_days_label?: string | null;
  timing?: string | null;
  fees_amount?: number | string | null;
  discount_percent?: number | string | null;
  discount_amount?: number | string | null;
  net_amount?: number | string | null;
  paid_amount?: number | string | null;
  refund_amount?: number | string | null;
  mof_receivable_amount?: number | string | null;
  other_receivable_amount?: number | string | null;
  other_party_name?: string | null;
  irrecoverable_debt?: number | string | null;
  net_receivable?: number | string | null;
  payment_date?: string | null;
  teacher_name?: string | null;
  payment_status?: string | null;
  payment_status_label?: string | null;
  class_status?: string | null;
  class_status_label?: string | null;
  starting_date?: string | null;
  next_installment_date?: string | null;
  remarks?: string | null;
  currency?: string | null;
}

export interface FinanceCourseRow {
  id: number;
  student_name?: string | null;
  course_title?: string | null;
  plan_name?: string | null;
  amount?: number | string | null;
  payment_status?: string | null;
  payment_status_label?: string | null;
  purchase_date?: string | null;
  subscription_status?: string | null;
  subscription_status_label?: string | null;
}

export interface FinanceReportParams {
  module: FinanceModule;
  period: FinancePeriod;
  date?: string;
  month?: string;
  year?: number;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: string;
  include_pending?: boolean | 0 | 1;
}
