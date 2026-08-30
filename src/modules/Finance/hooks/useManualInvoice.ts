import { useMutationApi, useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { FINANCE_ENDPOINTS, FINANCE_QUERY_KEYS } from "../data/constants/endpoints";
import type { FinanceInvoiceRow } from "../data/models/FinanceReport";

export interface ManualInvoicePayload {
  class_student_id?: number;
  amount: number;
  currency: string;
  exchange_rate?: number;
  transaction_date?: string;
  customer_name?: string;
  service_name?: string;
  cost?: number;
  notes?: string;
}

function extractInvoiceNumberPayload(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const envelope = response as { data?: { invoice_number?: string } | string };
  if (typeof envelope.data === "object" && envelope.data?.invoice_number) {
    return envelope.data.invoice_number;
  }
  return null;
}

export function useNextManualInvoiceNumber(enabled = true) {
  const primary = useQueryApi<{ invoice_number: string }>({
    queryKey: [...FINANCE_QUERY_KEYS.invoices, "next-number", "primary"] as const,
    url: FINANCE_ENDPOINTS.MANUAL_INVOICE_NEXT_NUMBER,
    method: RequestMethod.GET,
    options: { enabled, retry: 1 },
  });

  const fallback = useQueryApi<{ invoice_number: string }>({
    queryKey: [...FINANCE_QUERY_KEYS.invoices, "next-number", "fallback"] as const,
    url: FINANCE_ENDPOINTS.INVOICES,
    method: RequestMethod.GET,
    params: { preview_next_number: 1 },
    options: {
      enabled: enabled && (primary.isError || (primary.isSuccess && !extractInvoiceNumberPayload(primary.data))),
      retry: 1,
    },
  });

  const active = !primary.isError ? primary : fallback;

  return {
    ...active,
    data: extractInvoiceNumberPayload(primary.data) ? primary.data : fallback.data,
    isLoading: primary.isLoading || (primary.isError && fallback.isLoading),
    refetch: async () => {
      const primaryResult = await primary.refetch();
      if (extractInvoiceNumberPayload(primaryResult.data)) {
        return primaryResult;
      }
      return fallback.refetch();
    },
  };
}

export function extractNextInvoiceNumber(response: unknown): string | null {
  return extractInvoiceNumberPayload(response);
}

export function useCreateManualInvoice() {
  return useMutationApi<FinanceInvoiceRow, ManualInvoicePayload>({
    url: FINANCE_ENDPOINTS.MANUAL_INVOICES,
    method: RequestMethod.POST,
    invalidateKeys: [
      FINANCE_QUERY_KEYS.report,
      FINANCE_QUERY_KEYS.invoices,
      FINANCE_QUERY_KEYS.manualInvoices,
      FINANCE_QUERY_KEYS.studentEnrollments,
      [...FINANCE_QUERY_KEYS.invoices, "next-number", "primary"],
      [...FINANCE_QUERY_KEYS.invoices, "next-number", "fallback"],
    ],
  });
}

export function extractManualInvoice(response: unknown): FinanceInvoiceRow | null {
  if (!response || typeof response !== "object") return null;
  const envelope = response as { data?: FinanceInvoiceRow };
  return envelope.data ?? null;
}
