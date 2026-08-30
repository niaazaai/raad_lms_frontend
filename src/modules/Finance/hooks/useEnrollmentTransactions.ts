import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { FINANCE_ENDPOINTS, FINANCE_QUERY_KEYS } from "../data/constants/endpoints";
import type { FinanceTransaction } from "../data/models/FinanceReport";

export function useEnrollmentTransactions(enrollmentId: number | null) {
  return useQueryApi<FinanceTransaction[]>({
    queryKey: FINANCE_QUERY_KEYS.enrollmentTransactions(enrollmentId ?? 0),
    url: FINANCE_ENDPOINTS.ENROLLMENT_TRANSACTIONS(enrollmentId ?? 0),
    method: RequestMethod.GET,
    options: { enabled: enrollmentId != null && enrollmentId > 0 },
  });
}

export function extractEnrollmentTransactions(response: unknown): FinanceTransaction[] {
  if (!response || typeof response !== "object") return [];
  const envelope = response as { data?: unknown };
  if (Array.isArray(envelope.data)) return envelope.data as FinanceTransaction[];
  if (envelope.data && typeof envelope.data === "object") {
    const nested = envelope.data as { data?: unknown };
    if (Array.isArray(nested.data)) return nested.data as FinanceTransaction[];
  }
  return [];
}
