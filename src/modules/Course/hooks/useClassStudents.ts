import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMutationApi, useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";
import { FINANCE_QUERY_KEYS } from "@/modules/Finance/data/constants/endpoints";
import { callApi } from "@/services";

export interface ClassStudentRow {
  id: number;
  class_id: number;
  student_id: number;
  student_code?: string;
  first_name?: string;
  last_name?: string;
  father_name?: string | null;
  full_name?: string;
  email?: string;
  phone_number?: string;
  national_id?: string | null;
  user_name?: string;
  grade?: string;
  marks?: number | string | null;
  mock_results?: number[];
  final_score?: number | null;
  final_passed?: boolean | null;
  final_proof_path?: string | null;
  final_proof_url?: string | null;
  enrollment_date?: string;
  status?: string;
  disable_reason?: string | null;
  class_fee?: number | string | null;
  discount_percent?: number | string;
  discount_type?: string;
  discount_amount?: number | string;
  fee_amount?: number | string;
  paid_amount?: number | string;
  due_amount?: number | string;
  payment_status?: string;
  mof_receivable_amount?: number | string;
  other_receivable_amount?: number | string;
  other_party_name?: string | null;
  irrecoverable_debt?: number | string;
  currency?: string;
  next_due_date?: string | null;
  notes?: string | null;
  class_name?: string | null;
  class_code?: string | null;
}

export interface ClassStudentInvoice {
  id: number;
  invoice_number: string;
  class_student_id: number;
  amount?: number | string;
  currency?: string;
  pdf_url?: string | null;
}

/** Prefix for all class-student list queries (matches any pagination/filter params). */
export const classStudentsListPrefix = (classId: number) =>
  ["lms-classes", classId, "students"] as const;

export const classStudentsQueryKey = (classId: number, params?: Record<string, unknown>) =>
  [...classStudentsListPrefix(classId), params] as const;

export function useClassStudents(classId: number, params?: Record<string, unknown>) {
  return useQueryApi<ClassStudentRow[]>({
    queryKey: classStudentsQueryKey(classId, params),
    url: `/lms-classes/${classId}/students`,
    method: RequestMethod.GET,
    params,
    options: { enabled: classId > 0 },
  });
}

export function useAttachClassStudent(classId: number) {
  return useMutationApi<ClassStudentRow | ClassStudentRow[], { student_id?: number; student_ids?: number[] }>({
    url: `/lms-classes/${classId}/students`,
    method: RequestMethod.POST,
    invalidateKeys: [classStudentsListPrefix(classId)],
  });
}

export function useUpdateClassStudent(classId: number, enrollmentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const hasFiles = Object.values(body).some((v) => v instanceof File);
      const response = await callApi<ClassStudentRow>({
        url: `/lms-classes/${classId}/students/${enrollmentId}`,
        method: RequestMethod.PUT,
        data: body,
        hasFiles,
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Update failed");
      }
      const payload = response.data as { data?: ClassStudentRow } | ClassStudentRow | undefined;
      if (payload && typeof payload === "object" && "data" in payload && payload.data) {
        return payload.data;
      }
      return payload as ClassStudentRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classStudentsListPrefix(classId) });
    },
  });
}

export function useRemoveClassStudent(classId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: number) => {
      const response = await callApi({
        url: `/lms-classes/${classId}/students/${enrollmentId}`,
        method: RequestMethod.DELETE,
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Remove failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classStudentsListPrefix(classId) });
    },
  });
}

export function useDisableClassStudent(classId: number, enrollmentId: number) {
  return useMutationApi<ClassStudentRow, { disable_reason: string }>({
    url: `/lms-classes/${classId}/students/${enrollmentId}/disable`,
    method: RequestMethod.POST,
    invalidateKeys: [classStudentsListPrefix(classId)],
  });
}

export function useRecordClassStudentPayment(classId: number, enrollmentId: number) {
  return useMutationApi<
    ClassStudentRow,
    {
      discount_type: string;
      discount_amount?: number;
      payment_amount: number;
      currency: string;
      exchange_rate?: number;
      transaction_date?: string;
      next_due_date?: string | null;
      notes?: string;
      receivable_status?: string;
      other_party_name?: string;
      irrecoverable_debt?: number;
    }
  >({
    url: `/lms-classes/${classId}/students/${enrollmentId}/payments`,
    method: RequestMethod.POST,
    invalidateKeys: [
      classStudentsListPrefix(classId),
      FINANCE_QUERY_KEYS.report,
      FINANCE_QUERY_KEYS.studentEnrollments,
    ],
  });
}

export function useRefundClassStudentPayment(classId: number, enrollmentId: number) {
  return useMutationApi<
    ClassStudentRow,
    {
      amount: number;
      transaction_date?: string;
      reason?: string;
    }
  >({
    url: `/lms-classes/${classId}/students/${enrollmentId}/refunds`,
    method: RequestMethod.POST,
    invalidateKeys: [classStudentsListPrefix(classId)],
  });
}

export function useGenerateClassStudentInvoice(classId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      transaction_id,
    }: {
      enrollmentId: number;
      transaction_id?: number;
    }) => {
      const response = await callApi<ClassStudentInvoice>({
        url: `/lms-classes/${classId}/students/${enrollmentId}/invoices`,
        method: RequestMethod.POST,
        data: transaction_id ? { transaction_id } : {},
      });
      if (!response.ok) {
        throw new Error(response.data?.message || "Invoice generation failed");
      }
      const payload = response.data as { data?: ClassStudentInvoice } | ClassStudentInvoice | undefined;
      if (payload && typeof payload === "object" && "data" in payload && payload.data) {
        return payload.data;
      }
      return payload as ClassStudentInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classStudentsListPrefix(classId) });
    },
  });
}

function extractList(response: unknown): ClassStudentRow[] {
  if (!response || typeof response !== "object") return [];
  const envelope = response as { data?: ClassStudentRow[] | { data?: ClassStudentRow[] } };
  if (Array.isArray(envelope.data)) return envelope.data;
  if (envelope.data && typeof envelope.data === "object" && Array.isArray(envelope.data.data)) {
    return envelope.data.data;
  }
  return [];
}

export { extractList as extractClassStudentsFromResponse };
