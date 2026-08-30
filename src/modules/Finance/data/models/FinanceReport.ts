export type FinanceModule = "class" | "course";
export type FinancePeriod = "daily" | "monthly" | "yearly" | "range";

export interface FinanceSummary {
  class_income: number;
  course_income: number;
  total_income: number;
  fees_amount: number;
  gross_amount?: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  refund_amount: number;
  mof_receivable: number;
  other_receivable: number;
  irrecoverable_debt: number;
  net_receivable: number;
  service_income?: number;
  service_cost?: number;
}

export interface FinancePeriodMeta {
  type: FinancePeriod;
  from: string;
  to: string;
}

export interface FinanceClassRow {
  id: number;
  class_id?: number | null;
  student_id?: number | null;
  student_name?: string | null;
  student_code?: string | null;
  father_name?: string | null;
  phone_number?: string | null;
  national_id?: string | null;
  email?: string | null;
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
  ending_date?: string | null;
  enrollment_date?: string | null;
  next_installment_date?: string | null;
  remarks?: string | null;
  currency?: string | null;
}

export interface FinanceCourseRow {
  id: number;
  student_name?: string | null;
  student_email?: string | null;
  course_title?: string | null;
  instructor_name?: string | null;
  plan_name?: string | null;
  plan_duration_days?: number | string | null;
  amount?: number | string | null;
  payment_status?: string | null;
  payment_status_label?: string | null;
  purchase_date?: string | null;
  subscription_public_id?: string | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  subscription_status?: string | null;
  subscription_status_label?: string | null;
}

export interface FinanceTransactionInvoice {
  id: number;
  invoice_number: string;
  amount?: number | string | null;
  currency?: string | null;
  issued_at?: string | null;
  pdf_url?: string | null;
}

export interface FinanceTransaction {
  id: number;
  class_student_id?: number | null;
  type?: string | null;
  type_label?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  exchange_rate?: number | string | null;
  transaction_date?: string | null;
  next_installment_date?: string | null;
  invoice_id?: number | null;
  invoice?: FinanceTransactionInvoice | null;
  service_name?: string | null;
  service_cost?: number | string | null;
  internal_notes?: string | null;
  transaction_type?: string | null;
  transaction_type_label?: string | null;
  notes?: string | null;
  created_at?: string | null;
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

export interface FinanceInvoiceRow {
  id: number;
  invoice_number: string;
  amount?: number | string | null;
  currency?: string | null;
  exchange_rate?: number | string | null;
  issued_at?: string | null;
  pdf_url?: string | null;
  class_student_id?: number | null;
  student_name?: string | null;
  student_code?: string | null;
  father_name?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  service_name?: string | null;
  service_cost?: number | string | null;
  internal_notes?: string | null;
  customer_name?: string | null;
  transaction?: FinanceTransaction | null;
}

export interface ManualInvoiceSummary {
  service_income: number;
  service_cost: number;
  count: number;
}

export interface ManualInvoiceTransactionRow {
  id: number;
  invoice_number: string;
  transaction_id?: number | null;
  transaction_date?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  exchange_rate?: number | string | null;
  issued_at?: string | null;
  pdf_url?: string | null;
  class_student_id?: number | null;
  student_name?: string | null;
  student_code?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  customer_name?: string | null;
  service_name?: string | null;
  service_cost?: number | string | null;
}

export interface UpcomingInstallmentRow {
  id: number;
  class_id?: number | null;
  student_id?: number | null;
  student_name?: string | null;
  student_code?: string | null;
  father_name?: string | null;
  phone_number?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  next_due_date?: string | null;
  payment_status?: string | null;
  payment_status_label?: string | null;
  currency?: string | null;
}
