import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { FINANCE_ENDPOINTS, FINANCE_QUERY_KEYS } from "../data/constants/endpoints";
import type { UpcomingInstallmentRow } from "../data/models/FinanceReport";

export function useUpcomingInstallments(daysAhead = 2) {
  return useQueryApi<UpcomingInstallmentRow[]>({
    queryKey: [...FINANCE_QUERY_KEYS.upcomingInstallments, daysAhead],
    url: FINANCE_ENDPOINTS.UPCOMING_INSTALLMENTS,
    method: RequestMethod.GET,
    params: { days_ahead: daysAhead },
  });
}

export function extractUpcomingInstallments(response: unknown): UpcomingInstallmentRow[] {
  if (!response || typeof response !== "object") return [];
  const envelope = response as { data?: unknown };
  if (Array.isArray(envelope.data)) return envelope.data as UpcomingInstallmentRow[];
  return [];
}
