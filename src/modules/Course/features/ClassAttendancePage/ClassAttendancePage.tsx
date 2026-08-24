import { useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "iconoir-react";
import { Button, PageBreadcrumb, Spinner } from "@/components/ui";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { useTranslation, type TranslationKey } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import {
  extractAttendanceGrid,
  nextAttendanceStatus,
  useClassAttendance,
  useMarkClassAttendance,
  type AttendanceDateCol,
  type AttendanceMarkStatus,
  type AttendanceStudentRow,
} from "../../hooks/useClassAttendance";

const WEEKDAY_KEYS: Record<string, TranslationKey> = {
  sat: "course.attendance.weekdays.sat",
  sun: "course.attendance.weekdays.sun",
  mon: "course.attendance.weekdays.mon",
  tue: "course.attendance.weekdays.tue",
  wed: "course.attendance.weekdays.wed",
  thu: "course.attendance.weekdays.thu",
  fri: "course.attendance.weekdays.fri",
};

const DATE_COL_PX = 40;
const HEADER_H = "h-[4.25rem]";
const ROW_H = "h-11";

const ClassAttendancePage = () => {
  const { classId: classIdParam } = useParams<{ classId: string }>();
  const classId = Number(classIdParam);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { t } = useTranslation();

  const { data, isLoading, error } = useClassAttendance(classId);
  const grid = extractAttendanceGrid(data);
  const markAttendance = useMarkClassAttendance(classId);

  const monthGroups = useMemo(() => {
    if (!grid?.dates?.length) return [];
    const groups: { key: string; label: string; dates: AttendanceDateCol[] }[] = [];
    for (const d of grid.dates) {
      const last = groups[groups.length - 1];
      if (!last || last.key !== d.month_key) {
        groups.push({ key: d.month_key, label: d.month, dates: [d] });
      } else {
        last.dates.push(d);
      }
    }
    return groups;
  }, [grid?.dates]);

  const datesWidth = (grid?.dates.length ?? 0) * DATE_COL_PX;

  const leftBodyRef = useRef<HTMLDivElement>(null);
  const midBodyRef = useRef<HTMLDivElement>(null);
  const rightBodyRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  const syncVertical = useCallback((source: HTMLDivElement) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    const top = source.scrollTop;
    for (const el of [leftBodyRef.current, midBodyRef.current, rightBodyRef.current]) {
      if (el && el !== source && el.scrollTop !== top) el.scrollTop = top;
    }
    syncingRef.current = false;
  }, []);

  if (!hasPermission("course.class_students.read") && !hasPermission("course.lms_classes.read")) {
    return <PermissionDeniedCard />;
  }

  if (!classId || Number.isNaN(classId)) {
    return (
      <div className="p-2 sm:p-4">
        <p className="text-muted-foreground">{t("course.classStudents.invalidClass")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 sm:p-4">
        <p className="text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  const classMeta = grid?.class;
  const classCompleted = classMeta?.status === "completed" || classMeta?.can_edit === false;
  const canEdit =
    !classCompleted &&
    (hasPermission("course.lms_classes.update") || hasPermission("course.class_students.update"));
  const dateRange =
    classMeta?.start_date && classMeta?.end_date
      ? `${classMeta.start_date} → ${classMeta.end_date}`
      : null;

  return (
    <div className="flex h-full max-h-full min-h-0 min-w-0 w-full flex-col gap-3 overflow-hidden sm:gap-4">
      <div className="shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mb-1 gap-2 sm:mb-2"
          onClick={() => navigate("/attendance")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("course.attendance.backToAttendance")}
        </Button>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t("course.attendance.title")}</h1>
        <div className="mt-1 sm:mt-2">
          <PageBreadcrumb
            items={[
              { label: t("breadcrumb.dashboard"), to: "/dashboard" },
              { label: t("course.attendance.hubTitle"), to: "/attendance" },
              { label: t("course.attendance.title") },
            ]}
          />
        </div>
        {!dateRange && !isLoading ? (
          <p className="mt-2 text-sm text-warning">{t("course.attendance.missingDates")}</p>
        ) : null}
        {classCompleted && !isLoading ? (
          <p className="mt-2 text-sm text-warning">{t("course.attendance.completedLocked")}</p>
        ) : null}
      </div>

      {isLoading || !grid ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[0.6rem] border border-border bg-card">
          <div className="flex shrink-0 flex-col gap-2 border-b border-border bg-muted/30 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {classMeta?.name ? (
                <span className="truncate text-sm font-semibold text-foreground">{classMeta.name}</span>
              ) : null}
              {classMeta?.class_code ? (
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {classMeta.class_code}
                </span>
              ) : null}
              {classMeta?.schedule_days_label ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {classMeta.schedule_days_label}
                </span>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <AttendanceLegend completed={classCompleted} />
              {dateRange ? (
                <span className="shrink-0 rounded-[0.5rem] border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground sm:text-xs">
                  {dateRange}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rtl:flex-row-reverse">
              {/* Frozen student columns */}
              <div className="flex w-[8.5rem] shrink-0 flex-col overflow-hidden border-e border-border sm:w-[14rem] lg:w-[20.5rem]">
                <div
                  className={cn(
                    HEADER_H,
                    "flex shrink-0 items-end gap-2 border-b border-border bg-muted/80 px-2 py-2 text-[11px] font-medium sm:text-xs"
                  )}
                >
                  <span className="hidden w-[5.25rem] shrink-0 sm:block">
                    {t("course.columns.student_code")}
                  </span>
                  <span className="min-w-0 flex-1">{t("course.columns.full_name")}</span>
                  <span className="hidden w-[6.25rem] shrink-0 lg:block">
                    {t("course.columns.father_name")}
                  </span>
                </div>
                <div
                  ref={leftBodyRef}
                  className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
                  onScroll={(e) => syncVertical(e.currentTarget)}
                >
                  {grid.students.length === 0 ? (
                    <div className="px-2 py-10 text-center text-xs text-muted-foreground">
                      {t("course.classStudents.empty")}
                    </div>
                  ) : (
                    grid.students.map((student) => (
                      <div
                        key={student.student_id}
                        className={cn(
                          ROW_H,
                          "flex items-center gap-2 border-b border-border px-2 text-xs hover:bg-muted/20"
                        )}
                      >
                        <span className="hidden w-[5.25rem] shrink-0 truncate font-mono sm:block">
                          {student.student_code ?? student.student_id}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {student.full_name || "—"}
                        </span>
                        <span className="hidden w-[6.25rem] shrink-0 truncate text-muted-foreground lg:block">
                          {student.father_name || "—"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Date / P-A-L columns — one bottom horizontal scrollbar */}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                {grid.dates.length === 0 ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-10 text-center text-sm text-muted-foreground">
                    {t("course.attendance.notStarted")}
                  </div>
                ) : (
                <div
                  ref={midBodyRef}
                  className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain"
                  onScroll={(e) => syncVertical(e.currentTarget)}
                >
                  <div style={{ width: datesWidth }} className="min-h-full">
                    <div className="sticky top-0 z-10">
                      <div className="flex h-7 border-b border-border bg-muted/90">
                        {monthGroups.map((g) => (
                          <div
                            key={g.key}
                            style={{ width: g.dates.length * DATE_COL_PX }}
                            className="flex items-center justify-center border-e border-border text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]"
                          >
                            {g.label}
                          </div>
                        ))}
                      </div>
                      <div className="flex h-10 border-b border-border bg-muted/80">
                        {grid.dates.map((d) => (
                          <div
                            key={d.date}
                            title={d.date}
                            style={{ width: DATE_COL_PX }}
                            className={cn(
                              "flex flex-col items-center justify-center px-0 text-center",
                              d.week_separator
                                ? "border-e-[3px] border-e-foreground/45"
                                : "border-e border-border",
                              d.is_today && "bg-primary/10 text-primary"
                            )}
                          >
                            <span className="block text-[9px] font-semibold lowercase leading-none text-muted-foreground sm:text-[10px]">
                              {WEEKDAY_KEYS[d.weekday ?? ""]
                                ? t(WEEKDAY_KEYS[d.weekday ?? ""])
                                : (d.weekday ?? "")}
                            </span>
                            <span className="mt-0.5 block font-mono text-[11px] leading-none sm:text-xs">
                              {d.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {grid.students.length === 0 ? (
                      <div className="h-11" />
                    ) : (
                      grid.students.map((student) => (
                        <AttendanceDateRow
                          key={student.student_id}
                          student={student}
                          dates={grid.dates}
                          width={datesWidth}
                          canEdit={canEdit}
                          onToggle={(date, next) => {
                            markAttendance.mutate({
                              student_id: student.student_id,
                              date,
                              status: next,
                            });
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
                )}
              </div>

              {/* Frozen totals */}
              <div className="flex w-[6.75rem] shrink-0 flex-col overflow-hidden border-s border-border sm:w-[8.25rem]">
                <div
                  className={cn(
                    HEADER_H,
                    "grid shrink-0 grid-cols-3 items-end border-b border-border bg-muted/80 px-1 py-2 text-center text-[10px] font-medium sm:text-[11px]"
                  )}
                >
                  <span className="text-success">{t("course.attendance.totalPresent")}</span>
                  <span className="text-danger">{t("course.attendance.totalAbsent")}</span>
                  <span className="text-info">{t("course.attendance.totalLeave")}</span>
                </div>
                <div
                  ref={rightBodyRef}
                  className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  onScroll={(e) => syncVertical(e.currentTarget)}
                >
                  {grid.students.map((student) => (
                    <div
                      key={student.student_id}
                      className={cn(
                        ROW_H,
                        "grid grid-cols-3 items-center border-b border-border text-center hover:bg-muted/20"
                      )}
                    >
                      <span className="font-mono text-[11px] font-semibold tabular-nums text-success sm:text-xs">
                        {student.total_present}
                      </span>
                      <span className="font-mono text-[11px] font-semibold tabular-nums text-danger sm:text-xs">
                        {student.total_absent}
                      </span>
                      <span className="font-mono text-[11px] font-semibold tabular-nums text-info sm:text-xs">
                        {student.total_leave ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

const AttendanceLegend = ({ completed }: { completed: boolean }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="rounded-md bg-success/15 px-1.5 py-0.5 font-semibold text-success">
        {t("course.attendance.legendPresent")}
      </span>
      <span className="rounded-md bg-danger/15 px-1.5 py-0.5 font-semibold text-danger">
        {t("course.attendance.legendAbsent")}
      </span>
      <span className="rounded-md bg-info/15 px-1.5 py-0.5 font-semibold text-info">
        {t("course.attendance.legendLeave")}
      </span>
      <span className="hidden text-muted-foreground sm:inline">
        {completed ? t("course.attendance.completedLocked") : t("course.attendance.pastAndToday")}
      </span>
    </div>
  );
};

interface AttendanceDateRowProps {
  student: AttendanceStudentRow;
  dates: AttendanceDateCol[];
  width: number;
  canEdit: boolean;
  onToggle: (date: string, status: AttendanceMarkStatus) => void;
}

function AttendanceDateRow({ student, dates, width, canEdit, onToggle }: AttendanceDateRowProps) {
  return (
    <div className={cn(ROW_H, "flex hover:bg-muted/20")} style={{ width }}>
      {dates.map((d) => {
        const cell = student.attendance[d.date];
        const status = (cell?.status ?? null) as AttendanceMarkStatus | null;
        const editable = Boolean(canEdit && cell?.editable !== false && d.editable);

        return (
          <div
            key={d.date}
            style={{ width: DATE_COL_PX }}
            className={cn(
              "flex items-center justify-center",
              d.week_separator ? "border-e-[3px] border-e-foreground/45" : "border-e border-border",
              d.is_today && "bg-primary/5"
            )}
          >
            <AttendanceMarkButton
              status={status}
              date={d.date}
              studentLabel={student.full_name ?? student.student_code ?? String(student.student_id)}
              editable={editable}
              onToggle={() => onToggle(d.date, nextAttendanceStatus(status))}
            />
          </div>
        );
      })}
    </div>
  );
}

interface AttendanceMarkButtonProps {
  status: AttendanceMarkStatus | null;
  date: string;
  studentLabel: string;
  editable: boolean;
  onToggle: () => void;
}

function AttendanceMarkButton({
  status,
  date,
  studentLabel,
  editable,
  onToggle,
}: AttendanceMarkButtonProps) {
  const letter = status === "present" ? "P" : status === "absent" ? "A" : status === "leave" ? "L" : "";

  return (
    <button
      type="button"
      title={date}
      aria-label={`${studentLabel} ${date}`}
      disabled={!editable}
      onClick={() => {
        if (!editable) return;
        onToggle();
      }}
      className={cn(
        "flex size-6 items-center justify-center rounded-md border text-[10px] font-bold leading-none transition-colors duration-150 sm:size-7 sm:text-[11px]",
        status === "present" && "border-success/40 bg-success/15 text-success",
        status === "absent" && "border-danger/40 bg-danger/15 text-danger",
        status === "leave" && "border-info/40 bg-info/15 text-info",
        !status && "border-border bg-background text-muted-foreground",
        editable && "cursor-pointer hover:ring-2 hover:ring-primary/30",
        !editable && "cursor-default opacity-80"
      )}
    >
      {letter}
    </button>
  );
}

export default ClassAttendancePage;
