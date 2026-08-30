import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import type { DataTablePaginationMeta } from "@/types/datatable";
import { FINANCE_ENDPOINTS, FINANCE_QUERY_KEYS } from "../data/constants/endpoints";
import type { ManualInvoiceSummary, ManualInvoiceTransactionRow } from "../data/models/FinanceReport";

export interface ManualInvoiceListParams {
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: string;
}

export function useManualInvoiceTransactions(params: ManualInvoiceListParams) {
  return useQueryApi<ManualInvoiceTransactionRow[]>({
    queryKey: [...FINANCE_QUERY_KEYS.manualInvoices, params],
    url: FINANCE_ENDPOINTS.MANUAL_INVOICES,
    method: RequestMethod.GET,
    params,
  });
}

export function extractManualInvoiceRows(response: unknown): ManualInvoiceTransactionRow[] {
  if (!response || typeof response !== "object") return [];
  const envelope = response as { data?: unknown };
  if (Array.isArray(envelope.data)) return envelope.data as ManualInvoiceTransactionRow[];
  return [];
}

export function extractManualInvoicePagination(response: unknown): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta?.pagination ?? null;
}

export function extractManualInvoiceSummary(response: unknown): ManualInvoiceSummary | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { summary?: ManualInvoiceSummary } }).meta?.summary ?? null;
}
