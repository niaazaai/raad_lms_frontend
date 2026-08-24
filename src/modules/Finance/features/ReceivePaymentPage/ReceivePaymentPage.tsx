import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  Label,
  PageBreadcrumb,
  SearchableMultiSelect,
  SearchableSelect,
} from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDebounce } from "@/hooks/common/useDebounce";
import { useTranslation } from "@/i18n/useTranslation";
import {
  buildPaymentFormStateFromEnrollment,
  buildPaymentPayloadFromForm,
  ClassStudentPaymentForm,
  defaultPaymentFormState,
  isEnrollmentFullyPaid,
  resolveEnrollmentRemainingDue,
  type PaymentFormState,
} from "@/modules/Course/components/ClassStudentPaymentForm";
import { useRecordClassStudentPayment } from "@/modules/Course/hooks/useClassStudents";
import { useCourseEntityList, getCourseListFromResponse } from "@/modules/Course/hooks/useCourseEntity";
import { extractStudentEnrollments, useStudentActiveEnrollments } from "../../hooks/useReceivePayment";

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

const ReceivePaymentPage = () => {
  const { t } = useTranslation();
  const { hasAnyPermission } = useAuth();
  const canReceive = hasAnyPermission(["course.class_students.payment", "course.class_students.update"]);

  const [studentId, setStudentId] = useState<number | null>(null);
  const [selectedStudentLabel, setSelectedStudentLabel] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const debouncedStudentSearch = useDebounce(studentSearchQuery, 150);
  const studentSearchTerm = debouncedStudentSearch.trim();

  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(defaultPaymentFormState());

  const studentsListQuery = useCourseEntityList(
    "lms-class-students",
    {
      per_page: 25,
      page: 1,
      status: "active",
      picker: 1,
      search: studentSearchTerm || undefined,
    },
    { enabled: studentSearchTerm.length >= 1, keepPreviousData: true },
  );

  const availableStudents = getCourseListFromResponse(studentsListQuery.data);
  const studentOptions = useMemo(() => {
    const fromSearch = availableStudents.map((s) => formatStudentPickerLabel(s));
    if (studentId && selectedStudentLabel && !fromSearch.some((o) => o.value === String(studentId))) {
      return [{ value: String(studentId), label: selectedStudentLabel }, ...fromSearch];
    }
    return fromSearch;
  }, [availableStudents, selectedStudentLabel, studentId]);

  const enrollmentsQuery = useStudentActiveEnrollments(studentId);
  const enrollments = extractStudentEnrollments(enrollmentsQuery.data);

  const selectedEnrollment = useMemo(
    () => enrollments.find((row) => row.id === enrollmentId) ?? null,
    [enrollmentId, enrollments],
  );

  const classId = selectedEnrollment?.class_id ?? 0;
  const classFee = selectedEnrollment?.class_fee != null ? Number(selectedEnrollment.class_fee) : 0;
  const selectedEnrollmentFullyPaid = selectedEnrollment
    ? isEnrollmentFullyPaid(selectedEnrollment, classFee)
    : false;
  const recordPayment = useRecordClassStudentPayment(classId, enrollmentId ?? 0);

  const enrollmentOptions = useMemo(
    () =>
      enrollments.map((row) => {
        const rowClassFee = row.class_fee != null ? Number(row.class_fee) : 0;
        const name = row.class_name || t("finance.receivePayment.unknownClass");
        const code = row.class_code ? ` (${row.class_code})` : "";
        const due = resolveEnrollmentRemainingDue(row, rowClassFee);
        const paidSuffix = isEnrollmentFullyPaid(row, rowClassFee)
          ? ` · ${t("course.paymentStatus.paid")}`
          : due > 0
            ? ` · ${t("finance.receivePayment.due")} ${due.toLocaleString()}`
            : "";
        return {
          value: String(row.id),
          label: `${name}${code}${paidSuffix}`,
        };
      }),
    [enrollments, t],
  );

  const handleStudentChange = useCallback(
    (ids: string[]) => {
      const value = ids[0] ?? "";
      const nextId = value ? Number(value) : null;
      setStudentId(Number.isNaN(nextId) ? null : nextId);
      const match = studentOptions.find((o) => o.value === value);
      setSelectedStudentLabel(match?.label ?? "");
      setEnrollmentId(null);
      setPaymentForm(defaultPaymentFormState());
    },
    [studentOptions],
  );

  const handleEnrollmentChange = useCallback(
    (value: string) => {
      const nextId = value ? Number(value) : null;
      setEnrollmentId(Number.isNaN(nextId) ? null : nextId);
      const row = enrollments.find((e) => String(e.id) === value);
      if (row) {
        const rowClassFee = row.class_fee != null ? Number(row.class_fee) : 0;
        if (isEnrollmentFullyPaid(row, rowClassFee)) {
          toast.warning(t("finance.receivePayment.alreadyPaidMessage"));
          setPaymentForm(defaultPaymentFormState());
          return;
        }
        setPaymentForm(buildPaymentFormStateFromEnrollment(row, rowClassFee));
      } else {
        setPaymentForm(defaultPaymentFormState());
      }
    },
    [enrollments, t],
  );

  useEffect(() => {
    if (enrollmentId && !enrollments.some((row) => row.id === enrollmentId)) {
      setEnrollmentId(null);
      setPaymentForm(defaultPaymentFormState());
    }
  }, [enrollmentId, enrollments]);

  if (!canReceive) {
    return <PermissionDeniedCard />;
  }

  const handleSubmit = async () => {
    if (!selectedEnrollment || !classId || !enrollmentId || selectedEnrollmentFullyPaid) return;
    try {
      await recordPayment.mutateAsync(buildPaymentPayloadFromForm(paymentForm, selectedEnrollment, classFee));
      toast.success(t("finance.receivePayment.success"));
      const refreshed = await enrollmentsQuery.refetch();
      const updated = extractStudentEnrollments(refreshed.data).find((row) => row.id === enrollmentId);
      if (updated && !isEnrollmentFullyPaid(updated, classFee)) {
        setPaymentForm(buildPaymentFormStateFromEnrollment(updated, classFee));
      } else {
        setPaymentForm(defaultPaymentFormState());
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("course.classStudents.savePayment"));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-6 p-6 pb-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("finance.receivePayment.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("finance.receivePayment.subtitle")}</p>
            <div className="mt-2">
              <PageBreadcrumb
                items={[
                  { label: t("breadcrumb.dashboard"), to: "/dashboard" },
                  { label: t("finance.title"), to: "/finance" },
                  { label: t("finance.receivePayment.title") },
                ]}
              />
            </div>
          </div>
          <Button type="button" variant="outline" asChild>
            <Link to="/finance">{t("finance.receivePayment.backToReport")}</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-xl">
          <CardContent className="space-y-5 p-6">
            <SearchableMultiSelect
            label={t("finance.receivePayment.selectStudent")}
            options={studentOptions}
            value={studentId ? [String(studentId)] : []}
            onChange={handleStudentChange}
            placeholder={t("finance.receivePayment.studentPlaceholder")}
            searchPlaceholder={t("finance.receivePayment.studentSearch")}
            emptyMessage={t("finance.receivePayment.studentEmpty")}
            typeToSearchMessage={t("course.classStudents.typeToSearchStudents")}
            filterLocally={false}
            onSearchChange={setStudentSearchQuery}
            isSearching={studentsListQuery.isFetching}
            minSearchLength={1}
            max={1}
            />

            {studentId ? (
              <div className="space-y-1.5">
                <Label>{t("finance.receivePayment.selectClass")}</Label>
                {enrollmentsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
                ) : enrollmentOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("finance.receivePayment.noEnrollments")}</p>
                ) : (
                  <SearchableSelect
                    options={enrollmentOptions}
                    value={enrollmentId ? String(enrollmentId) : ""}
                    onChange={handleEnrollmentChange}
                    placeholder={t("finance.receivePayment.classPlaceholder")}
                    searchPlaceholder={t("finance.receivePayment.classSearch")}
                    emptyMessage={t("finance.receivePayment.classEmpty")}
                  />
                )}
              </div>
            ) : null}

            {selectedEnrollment && selectedEnrollmentFullyPaid ? (
              <div className="rounded-lg border border-success/20 bg-success/10 p-4 text-sm">
                <p className="font-medium text-success">{t("finance.receivePayment.alreadyPaidTitle")}</p>
                <p className="mt-1 text-muted-foreground">{t("finance.receivePayment.alreadyPaidMessage")}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("course.classStudents.alreadyPaid")}:{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {Number(selectedEnrollment.paid_amount ?? 0).toLocaleString()}{" "}
                    {String(selectedEnrollment.currency ?? "AFN")}
                  </span>
                </p>
              </div>
            ) : selectedEnrollment ? (
              <ClassStudentPaymentForm
                enrollment={selectedEnrollment}
                classFee={classFee}
                form={paymentForm}
                onFormChange={setPaymentForm}
                onSubmit={handleSubmit}
                isSubmitting={recordPayment.isPending}
                submitLabel={t("finance.receivePayment.submit")}
                classifyOnlyLabel={t("course.classStudents.classifyOnly")}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReceivePaymentPage;
