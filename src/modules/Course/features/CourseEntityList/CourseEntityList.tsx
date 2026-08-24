import { useMemo, useState, useCallback } from "react";
import { useParams, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { Prohibition, CheckCircle, Eye, EditPencil, Plus, Trash, AlbumList, Archive, Community as CommunityIcon, RefreshDouble, Calendar, Star } from "iconoir-react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import {
  useCourseEntityList,
  useDeleteCourseEntity,
  useUpdateCourseEntity,
  getCourseListFromResponse,
  type CourseRow,
} from "../../hooks/useCourseEntity";
import {
  COURSE_ENTITY_REGISTRY,
  type CourseEntitySlug,
  COURSE_ENTITY_SLUGS,
} from "../../data/courseRegistry";
import { COURSE_ENTITY_FORM_REGISTRY, coursePermission } from "../../data/courseEntityFormRegistry";
import CourseEntityFormDrawer, {
  type CourseEntityDrawerMode,
} from "../CourseEntityFormDrawer/CourseEntityFormDrawer";
import MainCategorySubCategoriesDrawer from "../MainCategorySubCategoriesDrawer/MainCategorySubCategoriesDrawer";
import StudentSuccessStoryDrawer from "../StudentSuccessStoryDrawer/StudentSuccessStoryDrawer";
import {
  Button,
  DataTable,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerOverlay,
  Input,
  Label,
  PageBreadcrumb,
  SearchableSelect,
  useConfirmDialog,
} from "@/components/ui";
import {
  useArchiveLmsClassMutation,
  useCompleteLmsClassMutation,
  useRestoreLmsClassMutation,
} from "../../hooks/useLmsClassActions";
import { Can, PermissionDeniedCard, useAuth } from "@/features/auth";
import { useConfirmPresets } from "@/i18n/useConfirmPresets";
import { useCourseI18n } from "../../hooks/useCourseI18n";
import { useDataTableParams } from "@/hooks";
import { cn } from "@/lib/utils";
import { API_V1_BASE } from "@/services/apiClient";
import type { DataTableConfig, DataTablePaginationMeta } from "@/types/datatable";

const RELATIVE_DATE_KEYS = new Set([
  "created_at",
  "updated_at",
  "uploaded_at",
  "issue_date",
  "approval_date",
  "subscription_start_date",
  "subscription_end_date",
  "start_date",
  "end_date",
  "instructor_feedback_date",
  "closed_at",
]);

// Columns that must show an exact calendar date (YYYY-MM-DD), never relative time.
const DATE_ONLY_KEYS = new Set(["purchase_date"]);

function formatYmd(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toISOString().slice(0, 10);
}

function formatTimePart(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

function ScheduleDateBadge({ row }: { row: CourseRow }) {
  const start = formatYmd(row.start_date);
  const end = formatYmd(row.end_date);
  if (start === "—" && end === "—") return <span>—</span>;
  return (
    <span className="inline-flex rounded-md border border-border px-2 py-0.5 font-mono text-xs text-foreground">
      {start} – {end}
    </span>
  );
}

function ScheduleTimeBadge({ row }: { row: CourseRow }) {
  const start = formatTimePart(row.start_time);
  const end = formatTimePart(row.end_time);
  if (!start && !end) return <span>—</span>;
  return (
    <span className="inline-flex rounded-md border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground">
      {start || "—"} – {end || "—"}
    </span>
  );
}

type LmsClassStatusTab = "active" | "archived" | "completed";

function isSlug(value: string | undefined): value is CourseEntitySlug {
  return !!value && (COURSE_ENTITY_SLUGS as string[]).includes(value);
}

const HIDDEN_INDEPENDENT_SLUGS: CourseEntitySlug[] = [
  "course-faasls",
  "lessons",
  "assignments",
  "downloadable-resources",
  "quiz-files",
];

function getPaginationFromResponse(response: unknown): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  const meta = (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta;
  return meta?.pagination ?? null;
}

function getTextOrFallback(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

function getCategoryThumbnailSrc(slug: CourseEntitySlug, row: CourseRow): string | null {
  // Prefer the signed URL the API now returns for uploaded images.
  const direct = row.thumbnail_url;
  if (typeof direct === "string" && direct.trim().length > 0) return direct;

  // Fallback to the session-authenticated streaming endpoint.
  const rawId = row.id;
  const id = typeof rawId === "number" ? rawId : Number(rawId);
  if (typeof id !== "number" || Number.isNaN(id)) return null;
  if (slug === "main-categories") return `${API_V1_BASE}/main-categories/${id}/thumbnail`;
  if (slug === "sub-categories") return `${API_V1_BASE}/sub-categories/${id}/thumbnail`;
  return null;
}

function CategoryImageCell({ slug, row }: { slug: CourseEntitySlug; row: CourseRow }) {
  const [failed, setFailed] = useState(false);
  const title = getTextOrFallback(row.title, "Category");
  const src = getCategoryThumbnailSrc(slug, row);
  if (!src || failed) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
        {getTitleInitials(title)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-9 w-9 rounded-md border border-border object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function getMainCategoryName(row: CourseRow): string {
  if (typeof row.main_category_name === "string" && row.main_category_name.trim().length > 0) {
    return row.main_category_name;
  }
  const mainCategory = row.main_category;
  if (mainCategory && typeof mainCategory === "object") {
    const maybeTitle = (mainCategory as { title?: unknown }).title;
    if (typeof maybeTitle === "string" && maybeTitle.trim().length > 0) {
      return maybeTitle;
    }
  }
  return row.main_category_id ? `#${String(row.main_category_id)}` : "—";
}

function getTitleInitials(title: unknown): string {
  const normalized = typeof title === "string" ? title.trim() : "";
  if (!normalized) return "--";
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return normalized.slice(0, 2).toUpperCase();
}

function StatusBadge({ value }: { value: unknown }) {
  const { t } = useCourseI18n();
  const normalized = String(value ?? "").toLowerCase();
  const isActive = normalized === "active";
  const statusLabels: Record<string, string> = {
    active: t("common.active"),
    inactive: t("common.inactive"),
    expired: t("common.expired"),
    cancelled: t("common.cancelled"),
    archived: t("common.archived"),
    completed: t("common.completed"),
    pending: t("common.pending"),
    paid: t("common.paid"),
    partial: t("common.partial"),
    due: t("common.due"),
    disabled: t("common.disabled"),
  };
  const label = statusLabels[normalized] ?? (normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "—");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
      )}
    >
      {label}
    </span>
  );
}

function GradeBadge({ value }: { value: unknown }) {
  const grade = String(value ?? "PENDING").toUpperCase();
  const tone =
    grade === "A"
      ? "bg-success/15 text-success"
      : grade === "B"
        ? "bg-primary/15 text-primary"
        : grade === "C"
          ? "bg-warning/20 text-warning"
          : grade === "D" || grade === "F"
            ? "bg-danger/15 text-danger"
            : "bg-muted text-muted-foreground";
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", tone)}>{grade}</span>;
}

function ClassTypeBadge({ value }: { value: unknown }) {
  const { t } = useCourseI18n();
  const type = String(value ?? "").toLowerCase();
  const isOnline = type === "online";
  const label = isOnline ? t("course.online") : type === "offline" ? t("course.offline") : "—";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isOnline ? "bg-success/15 text-success" : "bg-info/15 text-info"
      )}
    >
      {label}
    </span>
  );
}

export type CourseEntityListProps = {
  /** List this entity without `:slug` in the URL (e.g. top-level `/instructors`). */
  forcedSlug?: CourseEntitySlug;
};

const CourseEntityList = ({ forcedSlug }: CourseEntityListProps = {}) => {
  const { hasPermission } = useAuth();
  const { entityTitle, columnHeader, t } = useCourseI18n();
  const confirmPresets = useConfirmPresets();
  const { confirm } = useConfirmDialog();
  const location = useLocation();
  const navigate = useNavigate();
  const { slug: slugFromRoute } = useParams<{ slug: string }>();
  const slug = forcedSlug ?? slugFromRoute;
  const [searchParams, setSearchParams] = useSearchParams();
  const [classStatusTab, setClassStatusTab] = useState<LmsClassStatusTab>("active");
  const [completeModalRow, setCompleteModalRow] = useState<CourseRow | null>(null);
  const [successStoryModalRow, setSuccessStoryModalRow] = useState<CourseRow | null>(null);
  const [completeEndDate, setCompleteEndDate] = useState("");
  const archiveClass = useArchiveLmsClassMutation();
  const restoreClass = useRestoreLmsClassMutation();
  const completeClass = useCompleteLmsClassMutation();
  const [filterCourseId, setFilterCourseId] = useState(searchParams.get("course_id") ?? "");
  const [filterClassId, setFilterClassId] = useState(searchParams.get("class_id") ?? "");
  const [filterSubscriptionStatus, setFilterSubscriptionStatus] = useState(
    searchParams.get("subscription_status") ?? ""
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<CourseEntityDrawerMode>("create");
  const [drawerEntityId, setDrawerEntityId] = useState<number | null>(null);
  const [subCategoriesDrawerOpen, setSubCategoriesDrawerOpen] = useState(false);
  const [subCategoriesMain, setSubCategoriesMain] = useState<{ id: number; title: string } | null>(
    null
  );

  const resolvedSlug = isSlug(slug) && !HIDDEN_INDEPENDENT_SLUGS.includes(slug) ? slug : null;
  const cfg = resolvedSlug ? COURSE_ENTITY_REGISTRY[resolvedSlug] : null;
  const formDef = resolvedSlug ? COURSE_ENTITY_FORM_REGISTRY[resolvedSlug] : null;

  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const coursesForStudentFilter = useCourseEntityList(
    resolvedSlug === "student-subscriptions" ? "courses" : null,
    { has_subscription_plans: 1, per_page: 200 }
  );
  const studentFilterCourseOptions = useMemo(() => {
    const list = getCourseListFromResponse(coursesForStudentFilter.data);
    return list.map((r) => ({
      value: String(r.id),
      label: `${String(r.title ?? t("common.course"))} (#${r.id})`,
    }));
  }, [coursesForStudentFilter.data, t]);

  const lmsClassStatusTabs = useMemo(
    () => [
      { value: "active" as const, label: t("course.classStatus.active") },
      { value: "archived" as const, label: t("course.classStatus.archived") },
      { value: "completed" as const, label: t("course.classStatus.completed") },
    ],
    [t],
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "active", label: t("common.active") },
      { value: "inactive", label: t("common.inactive") },
    ],
    [t],
  );

  const subscriptionStatusFilterOptions = useMemo(
    () => [
      { value: "active", label: t("course.subscriptionStatusValues.active") },
      { value: "inactive", label: t("course.subscriptionStatusValues.inactive") },
      { value: "expired", label: t("course.subscriptionStatusValues.expired") },
      { value: "cancelled", label: t("course.subscriptionStatusValues.cancelled") },
    ],
    [t],
  );

  const extraParams = useMemo(() => {
    const o: Record<string, string> = {};
    if (resolvedSlug === "student-subscriptions") {
      if (filterCourseId.trim()) o.course_id = filterCourseId.trim();
      if (filterSubscriptionStatus.trim()) o.subscription_status = filterSubscriptionStatus.trim();
    } else {
      if (cfg?.filterParams?.includes("course_id") && filterCourseId.trim()) {
        o.course_id = filterCourseId.trim();
      }
      if (cfg?.filterParams?.includes("class_id") && filterClassId.trim()) {
        o.class_id = filterClassId.trim();
      }
    }
    if (resolvedSlug === "lms-classes") {
      o.class_status = classStatusTab;
    }
    return o;
  }, [
    cfg,
    resolvedSlug,
    filterCourseId,
    filterClassId,
    filterSubscriptionStatus,
    classStatusTab,
  ]);

  const apiParams = {
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
    status: (params.filters.status as string) || undefined,
    ...extraParams,
  };

  const { data, isFetching, error } = useCourseEntityList(resolvedSlug, apiParams);
  const rows = resolvedSlug ? getCourseListFromResponse(data) : [];
  const pagination = getPaginationFromResponse(data);

  const { mutate: deleteRow, isPending: deleting } = useDeleteCourseEntity(
    resolvedSlug ?? "main-categories"
  );
  const { mutate: patchEntity, isPending: patching } = useUpdateCourseEntity(
    resolvedSlug ?? "main-categories"
  );

  const openCreateDrawer = useCallback(() => {
    setDrawerMode("create");
    setDrawerEntityId(null);
    setDrawerOpen(true);
  }, []);

  const openViewDrawer = useCallback((id: number) => {
    setDrawerMode("view");
    setDrawerEntityId(id);
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback((id: number) => {
    setDrawerMode("edit");
    setDrawerEntityId(id);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const openSubCategoriesDrawer = useCallback((row: CourseRow) => {
    const id = row.id;
    const idNum = typeof id === "number" ? id : Number(id);
    const canAct = typeof id === "number" || !Number.isNaN(idNum);
    if (!canAct) return;
    const numericId = typeof id === "number" ? id : idNum;
    const title = getTextOrFallback(row.title, t("course.category"));
    setSubCategoriesMain({ id: numericId, title });
    setSubCategoriesDrawerOpen(true);
  }, [t]);

  const closeSubCategoriesDrawer = useCallback(() => {
    setSubCategoriesDrawerOpen(false);
    setSubCategoriesMain(null);
  }, []);

  const applyFiltersToUrl = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (filterCourseId.trim()) next.set("course_id", filterCourseId.trim());
    else next.delete("course_id");
    if (filterClassId.trim()) next.set("class_id", filterClassId.trim());
    else next.delete("class_id");
    if (filterSubscriptionStatus.trim()) next.set("subscription_status", filterSubscriptionStatus.trim());
    else next.delete("subscription_status");
    setSearchParams(next, { replace: true });
  }, [filterCourseId, filterClassId, filterSubscriptionStatus, searchParams, setSearchParams]);

  const localizedEntityTitle = resolvedSlug ? entityTitle(resolvedSlug) : "";

  const tableConfig: DataTableConfig<CourseRow> = useMemo(() => {
    if (!cfg || !resolvedSlug || !formDef) {
      return {
        columns: [],
        rowId: (row) => (typeof row.id === "number" ? row.id : String(row.id ?? "")),
        emptyMessage: t("dataTable.noRecords"),
      };
    }
    const deletePerm = coursePermission(cfg.permission, "delete");
    const updatePerm = coursePermission(cfg.permission, "update");
    const statusToggle = formDef.statusToggle;

    const mappedColumns = cfg.columns.map((key) => ({
      key,
      header: columnHeader(key, resolvedSlug),
      minWidth:
        resolvedSlug === "lms-classes"
          ? key === "name"
            ? "160px"
            : key === "main_category_name" || key === "sub_category_name"
              ? "140px"
              : key === "schedule_date" || key === "schedule_time"
                ? "130px"
                : "100px"
          : undefined,
      sortable: key !== "id" && key !== "course_title" && key !== "user_name" && key !== "plan_name",
      filterable: key.includes("status"),
      filterOptions: key.includes("status") ? statusFilterOptions : undefined,
      render: (row: CourseRow) => {
        if (key === "main_category_name") {
          return getMainCategoryName(row);
        }
        if (key === "bio") {
          const raw = row[key];
          const text =
            raw === null || raw === undefined ? "" : typeof raw === "string" ? raw.trim() : String(raw);
          if (!text) return "—";
          return (
            <span className="line-clamp-2 max-w-xs text-left" title={text}>
              {text}
            </span>
          );
        }
        if (key.includes("status")) {
          return <StatusBadge value={row[key]} />;
        }
        if (key === "class_type") {
          return <ClassTypeBadge value={row[key]} />;
        }
        if (key === "class_fee") {
          const fee = row[key];
          if (fee === null || fee === undefined || fee === "") return "—";
          const num = Number(fee);
          if (Number.isNaN(num)) return String(fee);
          return (
            <span className="font-medium tabular-nums">
              {num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          );
        }
        if (key === "class_code") {
          return (
            <span className="font-mono text-sm font-medium text-primary">
              {getTextOrFallback(row.class_code)}
            </span>
          );
        }
        if (key === "main_category_name" || key === "sub_category_name") {
          return getTextOrFallback(row[key]);
        }
        if (key === "schedule_days") {
          const raw = String(row.schedule_days ?? "").trim();
          if (!raw) return "—";
          const labels: Record<string, string> = {
            odd: "Odd days",
            even: "Even days",
            both: "Both odd & even",
          };
          return labels[raw] ?? raw;
        }
        if (key === "students_count") {
          const count = Number(row.students_count ?? 0);
          return (
            <span className="font-medium tabular-nums">
              {Number.isNaN(count) ? 0 : count}
            </span>
          );
        }
        if (key === "schedule_date") {
          return <ScheduleDateBadge row={row} />;
        }
        if (key === "schedule_time") {
          return <ScheduleTimeBadge row={row} />;
        }
        if (key === "grade") {
          return <GradeBadge value={row[key]} />;
        }
        if (key === "success_story") {
          const count = Number(row.success_stories_count ?? 0);
          const hasLegacy =
            typeof row.success_story_image_url === "string" && row.success_story_image_url.trim() !== "";
          const hasStory = count > 0 || hasLegacy;
          return hasStory ? (
            <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
              {count > 1 ? `${count} ${t("course.successStoryPublished")}` : t("course.successStoryPublished")}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        }
        if (resolvedSlug === "lms-class-students" && key === "full_name") {
          const full =
            String(row.full_name ?? "").trim() ||
            `${String(row.first_name ?? "").trim()} ${String(row.last_name ?? "").trim()}`.trim() ||
            "—";
          return <span className="font-medium">{full}</span>;
        }
        if (resolvedSlug === "lms-class-students" && key === "user_name") {
          const userName = String(row.user_name ?? "").trim();
          if (!userName) {
            return (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                None
              </span>
            );
          }
          const userId = getTextOrFallback(row.user_id, "");
          return userId !== "—" ? `${userName} (#${userId})` : userName;
        }
        if (key === "thumbnail") {
          return <CategoryImageCell slug={resolvedSlug} row={row} />;
        }

        const v = row[key];
        if (v === null || v === undefined) return "—";
        if (DATE_ONLY_KEYS.has(key) && (typeof v === "string" || typeof v === "number")) {
          return formatYmd(v);
        }
        if (RELATIVE_DATE_KEYS.has(key) && (typeof v === "string" || typeof v === "number")) {
          return formatRelativeTime(String(v));
        }
        if (typeof v === "object") return JSON.stringify(v);
        return String(v);
      },
    }));

    const columns =
      resolvedSlug === "main-categories" || resolvedSlug === "sub-categories"
        ? [
            ...mappedColumns.slice(0, 1),
            {
              key: "thumbnail",
              header: columnHeader("image", resolvedSlug),
              sortable: false,
              filterable: false,
              render: (row: CourseRow) => <CategoryImageCell slug={resolvedSlug} row={row} />,
            },
            ...mappedColumns.slice(1),
          ]
        : mappedColumns;

    return {
      columns,
      rowId: (row) => (typeof row.id === "number" ? row.id : String(row.id ?? "")),
      emptyMessage: t("dataTable.noRecords"),
      actions: [
        ...(resolvedSlug === "instructors"
          ? []
          : [
              {
                key: "view",
                label: t("common.view"),
                icon: <Eye className="h-4 w-4" />,
                permission: cfg.permission,
                onClick: (row: CourseRow) => {
                  const id = row.id;
                  const idNum = typeof id === "number" ? id : Number(id);
                  const canAct = typeof id === "number" || !Number.isNaN(idNum);
                  if (!canAct) return;
                  openViewDrawer(typeof id === "number" ? id : idNum);
                },
              },
            ]),
        ...(resolvedSlug === "lms-classes"
          ? [
              {
                key: "students",
                label: t("course.students"),
                icon: <CommunityIcon className="h-4 w-4" />,
                permission: "course.class_students.read",
                onClick: (row: CourseRow) => {
                  const id = typeof row.id === "number" ? row.id : Number(row.id);
                  if (!Number.isNaN(id)) navigate(`/classes/${id}/students`);
                },
              },
              {
                key: "attendance",
                label: t("course.attendance.title"),
                icon: <Calendar className="h-4 w-4" />,
                permission: "course.lms_classes.read",
                onClick: (row: CourseRow) => {
                  const id = typeof row.id === "number" ? row.id : Number(row.id);
                  if (!Number.isNaN(id)) navigate(`/classes/${id}/attendance`);
                },
              },
              {
                key: "archive",
                label: t("course.archive"),
                icon: <Archive className="h-4 w-4" />,
                permission: updatePerm,
                onClick: async (row: CourseRow) => {
                  const id = typeof row.id === "number" ? row.id : Number(row.id);
                  if (Number.isNaN(id)) return;
                  if (!(await confirm({ title: t("course.archiveClassTitle"), message: t("course.archiveClassMessage"), confirmText: t("course.archive"), variant: "warning" }))) return;
                  archiveClass.mutate({ id });
                },
              },
              {
                key: "restore",
                label: t("course.restore"),
                icon: <RefreshDouble className="h-4 w-4" />,
                permission: updatePerm,
                onClick: async (row: CourseRow) => {
                  const id = typeof row.id === "number" ? row.id : Number(row.id);
                  if (Number.isNaN(id)) return;
                  restoreClass.mutate({ id });
                },
              },
              {
                key: "complete",
                label: t("course.complete"),
                icon: <CheckCircle className="h-4 w-4" />,
                permission: updatePerm,
                onClick: (row: CourseRow) => {
                  setCompleteModalRow(row);
                  setCompleteEndDate(formatYmd(row.end_date) !== "—" ? formatYmd(row.end_date) : "");
                },
              },
            ].filter((action) => {
              if (action.key === "archive") return classStatusTab === "active";
              if (action.key === "restore") return classStatusTab === "archived";
              if (action.key === "complete") return classStatusTab === "active";
              return true;
            })
          : []),
        ...(resolvedSlug === "main-categories"
          ? [
              {
                key: "sub-categories",
                label: t("course.subCategories"),
                icon: <AlbumList className="h-4 w-4" />,
                permission: COURSE_ENTITY_REGISTRY["sub-categories"].permission,
                onClick: (row: CourseRow) => openSubCategoriesDrawer(row),
              },
            ]
          : []),
        {
          key: "edit",
          label: t("common.edit"),
          icon: <EditPencil className="h-4 w-4" />,
          permission: updatePerm,
          onClick: (row) => {
            const id = row.id;
            const idNum = typeof id === "number" ? id : Number(id);
            const canAct = typeof id === "number" || !Number.isNaN(idNum);
            if (!canAct) return;
            openEditDrawer(typeof id === "number" ? id : idNum);
          },
        },
        ...(resolvedSlug === "lms-class-students"
          ? [
              {
                key: "success-story",
                label: t("course.successStory"),
                icon: <Star className="h-4 w-4" />,
                permission: updatePerm,
                onClick: (row: CourseRow) => setSuccessStoryModalRow(row),
              },
            ]
          : []),
        ...(statusToggle
          ? [
              {
                key: "toggle",
                label: (row: CourseRow) => {
                  const cur = String(row[statusToggle.field] ?? "");
                  return cur === statusToggle.activeValue ? t("course.deactivate") : t("course.activate");
                },
                icon: (row: CourseRow) => {
                  const cur = String(row[statusToggle.field] ?? "");
                  return cur === statusToggle.activeValue ? (
                    <Prohibition className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  );
                },
                variant: (row: CourseRow) => {
                  const cur = String(row[statusToggle.field] ?? "");
                  return cur === statusToggle.activeValue ? "danger" : "default";
                },
                permission: updatePerm,
                onClick: (row: CourseRow) => {
                  const id = row.id;
                  const idNum = typeof id === "number" ? id : Number(id);
                  const canAct = typeof id === "number" || !Number.isNaN(idNum);
                  if (!canAct || patching) return;
                  const numericId = typeof id === "number" ? id : idNum;
                  const cur = String(row[statusToggle.field] ?? "");
                  const nextVal =
                    cur === statusToggle.activeValue
                      ? statusToggle.inactiveValue
                      : statusToggle.activeValue;
                  patchEntity(
                    { id: numericId, body: { [statusToggle.field]: nextVal } },
                    {
                      onError: (e: unknown) =>
                        toast.error(e instanceof Error ? e.message : t("course.updateFailed")),
                    }
                  );
                },
              },
            ]
          : []),
        {
          key: "delete",
          label: t("common.delete"),
          icon: <Trash className="h-4 w-4" />,
          variant: "danger",
          permission: deletePerm,
          onClick: (row) => {
            const id = row.id;
            const idNum = typeof id === "number" ? id : Number(id);
            const canAct = typeof id === "number" || !Number.isNaN(idNum);
            if (!canAct || deleting) return;
            const numericId = typeof id === "number" ? id : idNum;
            void confirm(confirmPresets.delete(localizedEntityTitle)).then((ok: boolean) => {
              if (ok) deleteRow(numericId);
            });
          },
        },
      ],
    };
  }, [
    cfg,
    resolvedSlug,
    formDef,
    confirm,
    confirmPresets,
    deleteRow,
    deleting,
    patchEntity,
    patching,
    openViewDrawer,
    openEditDrawer,
    openSubCategoriesDrawer,
    classStatusTab,
    navigate,
    archiveClass,
    restoreClass,
    columnHeader,
    statusFilterOptions,
    localizedEntityTitle,
    t,
  ]);

  if (!resolvedSlug || !cfg) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t("course.unknownEntity")}</p>
      </div>
    );
  }

  if (!hasPermission(cfg.permission)) {
    return <PermissionDeniedCard />;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  const showCourseFilter = cfg.filterParams?.includes("course_id");
  const showClassFilter = cfg.filterParams?.includes("class_id");
  const createPerm = coursePermission(cfg.permission, "create");
  const isStandaloneInstructors =
    resolvedSlug === "instructors" &&
    (forcedSlug === "instructors" || location.pathname === "/instructors");
  const isStandaloneClasses =
    resolvedSlug === "lms-classes" &&
    (forcedSlug === "lms-classes" || location.pathname === "/classes");
  const isStandaloneStudents =
    resolvedSlug === "lms-class-students" &&
    (forcedSlug === "lms-class-students" || location.pathname === "/students");

  return (
    <div className="min-w-0 max-w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{localizedEntityTitle}</h1>
          <div className="mt-2">
            <PageBreadcrumb
              items={
                isStandaloneInstructors
                  ? [{ label: t("breadcrumb.dashboard"), to: "/dashboard" }, { label: localizedEntityTitle }]
                  : isStandaloneClasses
                    ? [{ label: t("breadcrumb.dashboard"), to: "/dashboard" }, { label: localizedEntityTitle }]
                    : isStandaloneStudents
                      ? [{ label: t("breadcrumb.dashboard"), to: "/dashboard" }, { label: localizedEntityTitle }]
                      : [{ label: t("breadcrumb.course"), to: "/course" }, { label: localizedEntityTitle }]
              }
            />
          </div>
        </div>
        <Can permission={createPerm}>
          <div className="flex flex-wrap items-center gap-3">
            {resolvedSlug === "lms-classes" && (
              <div className="inline-flex rounded-lg border border-border p-1">
                {lmsClassStatusTabs.map((tab) => (
                  <Button
                    key={tab.value}
                    type="button"
                    size="sm"
                    variant={classStatusTab === tab.value ? "default" : "ghost"}
                    onClick={() => setClassStatusTab(tab.value)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            )}
            <Button type="button" onClick={openCreateDrawer} className="shrink-0 gap-2">
              <Plus className="h-4 w-4 stroke-[1.5]" />
              {t("course.addNew")}
            </Button>
          </div>
        </Can>
      </div>

      {(showCourseFilter || showClassFilter) && resolvedSlug !== "student-subscriptions" && (
        <div className="flex flex-wrap items-end gap-3">
          {showCourseFilter && (
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="course-filter">
                {t("course.courseId")}
              </label>
              <input
                id="course-filter"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-40 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                value={filterCourseId}
                onChange={(e) => setFilterCourseId(e.target.value)}
                placeholder="e.g. 1"
              />
            </div>
          )}
          {showClassFilter && (
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="class-filter">
                {t("course.classId")}
              </label>
              <input
                id="class-filter"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-40 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                placeholder="e.g. 1"
              />
            </div>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={applyFiltersToUrl}>
            {t("course.applyFilters")}
          </Button>
        </div>
      )}

      {resolvedSlug === "student-subscriptions" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
          <div className="grid w-full gap-3 sm:max-w-xl sm:grid-cols-2">
            <SearchableSelect
              id="stu-sub-filter-course"
              label={t("course.course")}
              options={[{ value: "", label: t("course.allCourses") }, ...studentFilterCourseOptions]}
              value={filterCourseId}
              onChange={(v) => setFilterCourseId(v)}
              placeholder={t("course.filterByCourse")}
              disabled={coursesForStudentFilter.isFetching}
            />
            <SearchableSelect
              id="stu-sub-filter-status"
              label={t("course.subscriptionStatus")}
              options={[{ value: "", label: t("course.allStatuses") }, ...subscriptionStatusFilterOptions]}
              value={filterSubscriptionStatus}
              onChange={(v) => setFilterSubscriptionStatus(v)}
              placeholder={t("course.statusPlaceholder")}
            />
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={applyFiltersToUrl}>
            {t("course.applyFilters")}
          </Button>
        </div>
      )}

      <div className="min-w-0 max-w-full">
      <DataTable<CourseRow>
        data={rows}
        config={tableConfig}
        params={{
          ...params,
          filters: {
            ...params.filters,
            status: (params.filters.status as string) || undefined,
          },
        }}
        onParamsChange={updateParams}
        pagination={pagination}
        isLoading={isFetching}
      />
      </div>

      <Drawer open={drawerOpen} onClose={closeDrawer}>
        <DrawerOverlay />
        <DrawerContent
          className={
            resolvedSlug === "student-subscriptions"
              ? "w-[min(920px,96vw)] min-w-[300px]"
              : resolvedSlug === "lms-classes"
                ? "w-[min(720px,96vw)] min-w-[320px]"
                : resolvedSlug === "lms-class-students"
                  ? "w-[42%] min-w-[480px]"
                  : undefined
          }
        >
          <CourseEntityFormDrawer
            slug={resolvedSlug}
            entityTitle={localizedEntityTitle}
            mode={drawerMode}
            entityId={drawerEntityId}
            onSuccess={closeDrawer}
          />
        </DrawerContent>
      </Drawer>

      <MainCategorySubCategoriesDrawer
        open={subCategoriesDrawerOpen}
        onClose={closeSubCategoriesDrawer}
        mainCategoryId={subCategoriesMain?.id ?? null}
        mainCategoryTitle={subCategoriesMain?.title ?? ""}
      />

      <Drawer open={!!completeModalRow} onClose={() => setCompleteModalRow(null)}>
        <DrawerOverlay />
        <DrawerContent className="max-w-md">
          <DrawerHeader>
            <DrawerTitle>{t("course.markClassFinished")}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="complete-end-date">{t("course.endDate")}</Label>
              <Input
                id="complete-end-date"
                type="date"
                value={completeEndDate}
                onChange={(e) => setCompleteEndDate(e.target.value)}
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button type="button" variant="outline" onClick={() => setCompleteModalRow(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              loading={completeClass.isPending}
              onClick={() => {
                const id =
                  typeof completeModalRow?.id === "number"
                    ? completeModalRow.id
                    : Number(completeModalRow?.id);
                if (Number.isNaN(id)) return;
                completeClass.mutate(
                  { id, end_date: completeEndDate || undefined },
                  { onSuccess: () => setCompleteModalRow(null) }
                );
              }}
            >
              {t("course.classFinished")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <StudentSuccessStoryDrawer
        open={!!successStoryModalRow}
        onClose={() => setSuccessStoryModalRow(null)}
        row={successStoryModalRow}
      />
    </div>
  );
};

export default CourseEntityList;
