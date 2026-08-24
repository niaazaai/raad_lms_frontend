import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, EditPencil, Minus, Page, Plus, Prohibition, Trash, Undo, Wallet } from "iconoir-react";
import { toast } from "sonner";
import {
  Button,
  DataTable,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
  PageBreadcrumb,
  SearchableMultiSelect,
  Switch,
  useConfirmDialog,
} from "@/components/ui";
import { Can, PermissionDeniedCard, useAuth } from "@/features/auth";
import { useConfirmPresets, useFormatMessage } from "@/i18n/useConfirmPresets";
import { useTranslation } from "@/i18n/useTranslation";
import { useDataTableParams } from "@/hooks";
import { useDebounce } from "@/hooks/common/useDebounce";
import { cn } from "@/lib/utils";
import type { DataTableConfig, DataTablePaginationMeta } from "@/types/datatable";
import {
  useAttachClassStudent,
  useClassStudents,
  useDisableClassStudent,
  useGenerateClassStudentInvoice,
  useRecordClassStudentPayment,
  useRefundClassStudentPayment,
  useRemoveClassStudent,
  useUpdateClassStudent,
  extractClassStudentsFromResponse,
  type ClassStudentRow,
} from "../../hooks/useClassStudents";
import {
  buildPaymentFormStateFromEnrollment,
  buildPaymentPayloadFromForm,
  ClassStudentPaymentForm,
  defaultPaymentFormState,
  type PaymentFormState,
} from "../../components/ClassStudentPaymentForm";
import {
  useCourseEntityDetail,
  getCourseEntityDetailFromResponse,
} from "../../hooks/useCourseEntity";
import { useCourseEntityList, getCourseListFromResponse } from "../../hooks/useCourseEntity";

function getPagination(response: unknown): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  return (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta?.pagination ?? null;
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
      {labels[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1)}
    </span>
  );
}

function CurrencyBadge({ value }: { value: unknown }) {
  const raw = String(value ?? "AFN");
  const colors: Record<string, string> = {
    AFN: "bg-success/10 text-success",
    USD: "bg-info/10 text-info",
    GBP: "bg-warning/10 text-warning",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[raw] ?? "bg-muted text-muted-foreground")}>
      {raw}
    </span>
  );
}

function formatMoney(value: unknown): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

type RefundFormState = {
  amount: string;
  reason: string;
  transaction_date: string;
};

const ClassStudentsPage = () => {
  const { classId: classIdParam } = useParams<{ classId: string }>();
  const classId = Number(classIdParam);
  const navigate = useNavigate();
  const { hasPermission, hasAnyPermission } = useAuth();
  const { confirm } = useConfirmDialog();
  const confirmPresets = useConfirmPresets();
  const { t } = useTranslation();

  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
  });

  const classDetailQuery = useCourseEntityDetail("lms-classes", classId > 0 ? classId : null);
  const classRow = getCourseEntityDetailFromResponse(classDetailQuery.data);
  const className = String(classRow?.name ?? "Class");
  const classCode = String(classRow?.class_code ?? "");
  const classFee = classRow?.class_fee != null ? Number(classRow.class_fee) : 0;

  const apiParams = {
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  };

  const { data, isLoading, error } = useClassStudents(classId, apiParams);
  const rows = extractClassStudentsFromResponse(data);
  const pagination = getPagination(data);

  const attachStudent = useAttachClassStudent(classId);
  const removeStudent = useRemoveClassStudent(classId);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedStudentLabels, setSelectedStudentLabels] = useState<Record<string, string>>({});
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const debouncedStudentSearch = useDebounce(studentSearchQuery, 150);
  const studentSearchTerm = debouncedStudentSearch.trim();
  const [gradeModal, setGradeModal] = useState<ClassStudentRow | null>(null);
  const [disableModal, setDisableModal] = useState<ClassStudentRow | null>(null);
  const [paymentModal, setPaymentModal] = useState<ClassStudentRow | null>(null);
  const [refundModal, setRefundModal] = useState<ClassStudentRow | null>(null);
  const [disableReason, setDisableReason] = useState("");
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(defaultPaymentFormState());
  const [refundForm, setRefundForm] = useState<RefundFormState>({
    amount: "",
    reason: "",
    transaction_date: todayIsoDate(),
  });

  const generateInvoice = useGenerateClassStudentInvoice(classId);

  const canPay = hasAnyPermission(["course.class_students.payment", "course.class_students.update"]);
  const canRefund = hasAnyPermission(["course.class_students.refund", "course.class_students.update"]);
  const canInvoice = hasAnyPermission(["course.class_students.invoice", "course.class_students.update"]);

  const studentsListQuery = useCourseEntityList(
    addOpen ? "lms-class-students" : null,
    {
      per_page: 25,
      page: 1,
      status: "active",
      picker: 1,
      search: studentSearchTerm || undefined,
    },
    { enabled: addOpen && studentSearchTerm.length >= 1, keepPreviousData: true }
  );
  const availableStudents = getCourseListFromResponse(studentsListQuery.data);
  const enrolledStudentIds = useMemo(
    () => new Set(rows.map((r) => Number(r.student_id)).filter((id) => !Number.isNaN(id))),
    [rows]
  );
  const studentOptions = useMemo(() => {
    const fromSearch = availableStudents
      .filter((s) => !enrolledStudentIds.has(Number(s.id)))
      .map((s) => formatStudentPickerLabel(s));

    const pinned = selectedStudentIds
      .filter((id) => !fromSearch.some((o) => o.value === id) && selectedStudentLabels[id])
      .map((id) => ({ value: id, label: selectedStudentLabels[id] }));

    return [...pinned, ...fromSearch];
  }, [availableStudents, enrolledStudentIds, selectedStudentIds, selectedStudentLabels]);

  const handleStudentSelectionChange = useCallback(
    (ids: string[]) => {
      setSelectedStudentIds(ids);
      setSelectedStudentLabels((prev) => {
        const next = { ...prev };
        for (const id of ids) {
          const match = studentOptions.find((o) => o.value === id);
          if (match) next[id] = match.label;
        }
        for (const key of Object.keys(next)) {
          if (!ids.includes(key)) delete next[key];
        }
        return next;
      });
    },
    [studentOptions]
  );

  useEffect(() => {
    if (addOpen) return;
    setStudentSearchQuery("");
    setSelectedStudentIds([]);
    setSelectedStudentLabels({});
  }, [addOpen]);

  const openGradeModal = (row: ClassStudentRow) => {
    setGradeModal(row);
  };

  const openPaymentModal = (row: ClassStudentRow) => {
    setPaymentForm(buildPaymentFormStateFromEnrollment(row, classFee));
    setPaymentModal(row);
  };

  const openRefundModal = (row: ClassStudentRow) => {
    setRefundForm({
      amount: row.paid_amount != null ? String(row.paid_amount) : "",
      reason: "",
      transaction_date: todayIsoDate(),
    });
    setRefundModal(row);
  };

  const handleGenerateInvoice = async (row: ClassStudentRow) => {
    if (Number(row.paid_amount ?? 0) <= 0) {
      toast.error(t("course.classStudents.invoiceNeedsPayment"));
      return;
    }
    try {
      const invoice = await generateInvoice.mutateAsync({ enrollmentId: row.id });
      if (invoice?.pdf_url) {
        window.open(invoice.pdf_url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(t("course.classStudents.invoiceFailed"));
        return;
      }
      toast.success(t("course.classStudents.invoiceGenerated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("course.classStudents.invoiceFailed"));
    }
  };

  const handleAddStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    await attachStudent.mutateAsync({
      student_ids: selectedStudentIds.map((id) => Number(id)),
    });
    setAddOpen(false);
    setSelectedStudentIds([]);
  };

  const tableConfig: DataTableConfig<ClassStudentRow> = useMemo(
    () => ({
      columns: [
        {
          key: "student_code",
          header: t("course.columns.student_code"),
          render: (row) => (
            <span className="font-mono text-sm">{String(row.student_code ?? row.student_id)}</span>
          ),
        },
        {
          key: "full_name",
          header: t("course.columns.full_name"),
          render: (row) => (
            <div className="min-w-[8rem]">
              <div className="font-medium">
                {row.full_name || `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "—"}
              </div>
              {row.phone_number ? (
                <div className="mt-0.5 text-xs text-muted-foreground">{row.phone_number}</div>
              ) : null}
            </div>
          ),
        },
        {
          key: "grade",
          header: t("course.columns.grade"),
          render: (row) => {
            const mocks = Array.isArray(row.mock_results) ? row.mock_results : [];
            const mockLabel = mocks.length > 0 ? mocks.join(" / ") : null;
            const finalLabel =
              row.final_passed == null
                ? null
                : `${row.final_passed ? t("course.classStudents.passed") : t("course.classStudents.failed")}${
                    row.final_score != null ? ` (${row.final_score})` : ""
                  }`;
            if (!mockLabel && !finalLabel) {
              return <span>{row.grade ?? "—"}</span>;
            }
            return (
              <div className="min-w-[7rem] space-y-0.5">
                {mockLabel ? <div className="font-mono text-sm tabular-nums">{mockLabel}</div> : null}
                {finalLabel ? (
                  <div
                    className={cn(
                      "text-xs font-medium",
                      row.final_passed ? "text-success" : "text-danger",
                    )}
                  >
                    {finalLabel}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">{t("course.gradePending")}</div>
                )}
              </div>
            );
          },
        },
        {
          key: "class_fee",
          header: t("course.columns.class_fee"),
          render: (row) => (
            <span>
              {formatMoney(row.class_fee ?? classFee)}{" "}
              <CurrencyBadge value={row.currency ?? "AFN"} />
            </span>
          ),
        },
        {
          key: "payment_status",
          header: t("course.columns.payment_status"),
          render: (row) => (
            <div className="flex flex-wrap items-center gap-1.5">
              <PaymentStatusBadge value={row.payment_status} />
              <CurrencyBadge value={row.currency} />
            </div>
          ),
        },
        {
          key: "due_amount",
          header: t("course.columns.due_amount"),
          render: (row) => {
            const status = String(row.payment_status ?? "pending");
            if (status === "paid") return <span className="text-muted-foreground">—</span>;
            return (
              <span>
                {formatMoney(row.due_amount)}{" "}
                <span className="text-xs text-muted-foreground">{String(row.currency ?? "AFN")}</span>
              </span>
            );
          },
        },
        {
          key: "status",
          header: t("course.columns.status"),
          render: (row) => (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                row.status === "disabled" ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
              )}
            >
              {row.status === "disabled" ? t("course.classStudents.disabled") : t("course.classStudents.active")}
            </span>
          ),
        },
      ],
      rowId: (row) => row.id,
      searchable: true,
      searchPlaceholder: t("course.classStudents.searchStudents"),
      paginationEnabled: true,
      emptyMessage: t("course.classStudents.empty"),
      actions: [
        {
          key: "grade",
          label: t("course.columns.grade"),
          icon: <EditPencil className="h-4 w-4" />,
          permission: "course.class_students.update",
          onClick: openGradeModal,
        },
        ...(canPay
          ? [
              {
                key: "payment",
                label: t("course.classStudents.payment"),
                icon: <Wallet className="h-4 w-4" />,
                onClick: openPaymentModal,
              },
            ]
          : []),
        ...(canRefund
          ? [
              {
                key: "refund",
                label: t("course.classStudents.refund"),
                icon: <Undo className="h-4 w-4" />,
                onClick: openRefundModal,
                hidden: (row: ClassStudentRow) => Number(row.paid_amount ?? 0) <= 0,
              },
            ]
          : []),
        ...(canInvoice
          ? [
              {
                key: "invoice",
                label: t("course.classStudents.invoice"),
                icon: <Page className="h-4 w-4" />,
                onClick: (row: ClassStudentRow) => {
                  void handleGenerateInvoice(row);
                },
                hidden: (row: ClassStudentRow) => Number(row.paid_amount ?? 0) <= 0,
              },
            ]
          : []),
        {
          key: "disable",
          label: t("common.disable"),
          icon: <Prohibition className="h-4 w-4" />,
          permission: "course.class_students.update",
          onClick: (row) => {
            if (row.status === "disabled") return;
            setDisableReason("");
            setDisableModal(row);
          },
        },
        {
          key: "remove",
          label: t("course.classStudents.remove"),
          icon: <Trash className="h-4 w-4" />,
          variant: "danger" as const,
          permission: "course.class_students.update",
          hidden: (row) => {
            const status = String(row.payment_status ?? "pending");
            return status === "paid" || status === "partial" || status === "mof_pending" || status === "other_party";
          },
          onClick: async (row) => {
            if (!(await confirm(confirmPresets.delete(t("course.classStudents.removeConfirmItem"))))) return;
            removeStudent.mutate(row.id);
          },
        },
      ],
    }),
    [canInvoice, canPay, canRefund, classFee, confirm, confirmPresets, removeStudent, t],
  );

  if (!hasPermission("course.class_students.read")) {
    return <PermissionDeniedCard />;
  }

  if (!classId || Number.isNaN(classId)) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t("course.classStudents.invalidClass")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button type="button" variant="ghost" size="sm" className="mb-2 gap-2" onClick={() => navigate("/classes")}>
            <ArrowLeft className="h-4 w-4" />
            {t("course.classStudents.backToClasses")}
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {className}
            {classCode ? (
              <span className="ms-2 font-mono text-base font-normal text-muted-foreground">{classCode}</span>
            ) : null}
          </h1>
          <div className="mt-2">
            <PageBreadcrumb
              items={[
                { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                { label: t("course.entities.lmsClasses.title"), to: "/classes" },
                { label: t("course.students") },
              ]}
            />
          </div>
        </div>
        <Can permission="course.class_students.update">
          <Button type="button" className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("course.classStudents.addStudent")}
          </Button>
        </Can>
      </div>

      <DataTable
        data={rows}
        config={tableConfig}
        params={params}
        onParamsChange={updateParams}
        pagination={pagination}
        isLoading={isLoading}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)}>
        <ModalOverlay />
        <ModalContent className="max-w-xl">
          <ModalHeader>
            <ModalTitle>{t("course.classStudents.addRegisteredStudent")}</ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <SearchableMultiSelect
              id="add-student-select"
              label={t("common.student")}
              required
              options={studentOptions}
              value={selectedStudentIds}
              onChange={handleStudentSelectionChange}
              placeholder={t("course.classStudents.selectStudents")}
              searchPlaceholder={t("course.classStudents.searchStudents")}
              emptyMessage={t("course.classStudents.noStudentMatches")}
              typeToSearchMessage={t("course.classStudents.typeToSearchStudents")}
              filterLocally={false}
              onSearchChange={setStudentSearchQuery}
              isSearching={studentsListQuery.isLoading}
              minSearchLength={1}
              disabled={false}
              max={10}
            />
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              loading={attachStudent.isPending}
              disabled={selectedStudentIds.length === 0}
              onClick={handleAddStudents}
            >
              {t("course.classStudents.addToClass")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <GradeModal
        open={!!gradeModal}
        row={gradeModal}
        classId={classId}
        onClose={() => setGradeModal(null)}
      />

      <DisableModal
        open={!!disableModal}
        classId={classId}
        enrollmentId={disableModal?.id ?? 0}
        reason={disableReason}
        onReasonChange={setDisableReason}
        onClose={() => setDisableModal(null)}
      />

      <PaymentModal
        open={!!paymentModal}
        row={paymentModal}
        classId={classId}
        classFee={classFee}
        form={paymentForm}
        onFormChange={setPaymentForm}
        onClose={() => setPaymentModal(null)}
      />

      <RefundModal
        open={!!refundModal}
        row={refundModal}
        classId={classId}
        form={refundForm}
        onFormChange={setRefundForm}
        onClose={() => setRefundModal(null)}
      />
    </div>
  );
};

interface GradeModalProps {
  open: boolean;
  row: ClassStudentRow | null;
  classId: number;
  onClose: () => void;
}

function GradeModal({ open, row, classId, onClose }: GradeModalProps) {
  const updateEnrollment = useUpdateClassStudent(classId, row?.id ?? 0);
  const { t } = useTranslation();
  const fmt = useFormatMessage();
  const [view, setView] = useState<"mocks" | "final">("mocks");
  const [mockScores, setMockScores] = useState<string[]>([""]);
  const [finalScore, setFinalScore] = useState("");
  const [finalPassed, setFinalPassed] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open || !row) return;
    const existing = Array.isArray(row.mock_results) && row.mock_results.length > 0
      ? row.mock_results.map((n) => String(n))
      : [""];
    setMockScores(existing);
    setFinalScore(row.final_score != null ? String(row.final_score) : "");
    setFinalPassed(Boolean(row.final_passed));
    setProofFile(null);
    setView("mocks");
  }, [open, row]);

  if (!open || !row) return null;

  const studentName = String(row.full_name ?? row.student_code ?? "");
  const parsedMocks = mockScores
    .map((s) => s.trim())
    .filter((s) => s !== "")
    .map((s) => Number(s));
  const mocksValid = parsedMocks.every((n) => Number.isInteger(n) && n >= 0);
  const finalScoreValid = finalScore.trim() === "" || Number.isInteger(Number(finalScore));

  const saveMocks = async () => {
    if (!mocksValid) return;
    await updateEnrollment.mutateAsync({ mock_results: parsedMocks });
    onClose();
  };

  const saveFinal = async () => {
    if (!finalScoreValid || finalScore.trim() === "") return;
    const body: Record<string, unknown> = {
      final_score: Number(finalScore),
      final_passed: finalPassed,
    };
    if (proofFile) body.final_proof_file = proofFile;
    await updateEnrollment.mutateAsync(body);
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="max-w-md">
        <DrawerHeader>
          <DrawerTitle>{fmt("course.classStudents.applyGrade", { name: studentName })}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          {view === "mocks" ? (
            <>
              <div>
                <Label>{t("course.classStudents.mockResults")}</Label>
                <p className="mt-1 text-xs text-muted-foreground">{t("course.classStudents.mockHint")}</p>
              </div>
              <div className="space-y-2">
                {mockScores.map((score, index) => (
                  <div key={`mock-${index}`} className="flex items-center gap-2">
                    <Input
                      id={`mock-score-${index}`}
                      type="number"
                      inputMode="numeric"
                      step={1}
                      min={0}
                      value={score}
                      onChange={(e) => {
                        const next = [...mockScores];
                        next[index] = e.target.value;
                        setMockScores(next);
                      }}
                      placeholder={fmt("course.classStudents.mockScore", { n: String(index + 1) })}
                    />
                    {mockScores.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setMockScores(mockScores.filter((_, i) => i !== index))}
                      >
                        <Minus className="h-4 w-4" />
                        <span className="sr-only">{t("course.classStudents.removeMock")}</span>
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
              {!mocksValid ? (
                <p className="text-sm text-danger">{t("course.classStudents.mockHint")}</p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => setMockScores([...mockScores, ""])}
              >
                <Plus className="h-4 w-4" />
                {t("course.classStudents.addMock")}
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={() => setView("final")}>
                {t("course.classStudents.finalAcca")}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" size="sm" className="gap-2 px-0" onClick={() => setView("mocks")}>
                {t("course.classStudents.backToMocks")}
              </Button>
              <div className="space-y-1.5">
                <Label htmlFor="final-score">{t("course.classStudents.finalScore")}</Label>
                <Input
                  id="final-score"
                  type="number"
                  inputMode="numeric"
                  step={1}
                  min={0}
                  value={finalScore}
                  onChange={(e) => setFinalScore(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{t("course.classStudents.passFail")}</p>
                  <p className="text-xs text-muted-foreground">
                    {finalPassed ? t("course.classStudents.passed") : t("course.classStudents.failed")}
                  </p>
                </div>
                <Switch checked={finalPassed} onCheckedChange={setFinalPassed} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="final-proof">{t("course.classStudents.proofAttachment")}</Label>
                <Input
                  id="final-proof"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">{t("course.classStudents.proofHint")}</p>
                {row.final_proof_url ? (
                  <a
                    href={row.final_proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {t("course.classStudents.existingProof")}
                  </a>
                ) : null}
              </div>
            </>
          )}
        </DrawerBody>
        <DrawerFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          {view === "mocks" ? (
            <Button type="button" loading={updateEnrollment.isPending} disabled={!mocksValid} onClick={() => void saveMocks()}>
              {t("course.classStudents.saveMocks")}
            </Button>
          ) : (
            <Button
              type="button"
              loading={updateEnrollment.isPending}
              disabled={!finalScoreValid || finalScore.trim() === ""}
              onClick={() => void saveFinal()}
            >
              {t("course.classStudents.saveFinal")}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface DisableModalProps {
  open: boolean;
  classId: number;
  enrollmentId: number;
  reason: string;
  onReasonChange: (v: string) => void;
  onClose: () => void;
}

function DisableModal({ open, classId, enrollmentId, reason, onReasonChange, onClose }: DisableModalProps) {
  const disableEnrollment = useDisableClassStudent(classId, enrollmentId);
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="max-w-md">
        <DrawerHeader>
          <DrawerTitle>{t("course.classStudents.disableStudent")}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className="space-y-1.5">
            <Label htmlFor="disable-reason">{t("course.classStudents.reason")}</Label>
            <textarea
              id="disable-reason"
              className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={t("course.classStudents.disableReasonPlaceholder")}
            />
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={disableEnrollment.isPending}
            onClick={async () => {
              if (!reason.trim()) return;
              await disableEnrollment.mutateAsync({ disable_reason: reason });
              onClose();
            }}
          >
            {t("course.classStudents.disableStudent")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface PaymentModalProps {
  open: boolean;
  row: ClassStudentRow | null;
  classId: number;
  classFee: number;
  form: PaymentFormState;
  onFormChange: (v: PaymentFormState) => void;
  onClose: () => void;
}

function PaymentModal({ open, row, classId, classFee, form, onFormChange, onClose }: PaymentModalProps) {
  const recordPayment = useRecordClassStudentPayment(classId, row?.id ?? 0);
  const { t } = useTranslation();
  const fmt = useFormatMessage();

  if (!open || !row) return null;

  const studentName = String(row.full_name ?? row.student_code ?? "");

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="max-w-md">
        <DrawerHeader>
          <DrawerTitle>{fmt("course.classStudents.paymentTitle", { name: studentName })}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <ClassStudentPaymentForm
            enrollment={row}
            classFee={classFee}
            form={form}
            onFormChange={onFormChange}
            isSubmitting={recordPayment.isPending}
            onSubmit={async () => {
              try {
                await recordPayment.mutateAsync(buildPaymentPayloadFromForm(form, row, classFee));
                onClose();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : t("course.classStudents.savePayment"));
              }
            }}
          />
        </DrawerBody>
        <DrawerFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface RefundModalProps {
  open: boolean;
  row: ClassStudentRow | null;
  classId: number;
  form: RefundFormState;
  onFormChange: (v: RefundFormState) => void;
  onClose: () => void;
}

function RefundModal({ open, row, classId, form, onFormChange, onClose }: RefundModalProps) {
  const refundPayment = useRefundClassStudentPayment(classId, row?.id ?? 0);
  const { t } = useTranslation();
  const fmt = useFormatMessage();

  if (!open || !row) return null;

  const studentName = String(row.full_name ?? row.student_code ?? "");
  const maxRefund = Number(row.paid_amount ?? 0);
  const amount = form.amount ? Number(form.amount) : 0;
  const canSubmit = amount > 0 && amount <= maxRefund + 0.01 && maxRefund > 0;

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="max-w-md">
        <DrawerHeader>
          <DrawerTitle>{fmt("course.classStudents.refundTitle", { name: studentName })}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t("course.classStudents.alreadyPaid")}</span>
              <span className="font-medium tabular-nums">
                {formatMoney(maxRefund)} {String(row.currency ?? "AFN")}
              </span>
            </div>
          </div>

          {maxRefund <= 0 ? (
            <p className="text-sm text-muted-foreground">{t("course.classStudents.noPaidBalance")}</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="refund-amount">{t("course.classStudents.refundAmount")}</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  min={0.01}
                  max={maxRefund}
                  value={form.amount}
                  onChange={(e) => onFormChange({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="refund-date">{t("course.classStudents.transactionDate")}</Label>
                <Input
                  id="refund-date"
                  type="date"
                  value={form.transaction_date}
                  onChange={(e) => onFormChange({ ...form, transaction_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="refund-reason">{t("course.classStudents.refundReason")}</Label>
                <textarea
                  id="refund-reason"
                  className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
                  value={form.reason}
                  onChange={(e) => onFormChange({ ...form, reason: e.target.value })}
                  placeholder={t("course.classStudents.refundReasonPlaceholder")}
                />
              </div>
            </>
          )}
        </DrawerBody>
        <DrawerFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={refundPayment.isPending}
            disabled={!canSubmit}
            onClick={async () => {
              try {
                await refundPayment.mutateAsync({
                  amount,
                  transaction_date: form.transaction_date || undefined,
                  reason: form.reason || undefined,
                });
                onClose();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : t("course.classStudents.saveRefund"));
              }
            }}
          >
            {t("course.classStudents.saveRefund")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default ClassStudentsPage;
