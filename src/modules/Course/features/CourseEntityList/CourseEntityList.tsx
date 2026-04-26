import { useMemo, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Prohibition, CheckCircle, Eye, EditPencil, Plus, Trash } from "iconoir-react";
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
import {
  COURSE_ENTITY_FORM_REGISTRY,
  coursePermission,
} from "../../data/courseEntityFormRegistry";
import CourseEntityFormDrawer, {
  type CourseEntityDrawerMode,
} from "../CourseEntityFormDrawer/CourseEntityFormDrawer";
import {
  Button,
  DataTable,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  PageBreadcrumb,
  useConfirmDialog,
  confirmPresets,
} from "@/components/ui";
import { Can, PermissionDeniedCard, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import { cn } from "@/lib/utils";
import type { DataTableConfig, DataTablePaginationMeta } from "@/types/datatable";

const RELATIVE_DATE_KEYS = new Set([
  "created_at",
  "updated_at",
  "uploaded_at",
  "issue_date",
  "purchase_date",
  "enrollment_date",
  "approval_date",
  "subscription_start_date",
  "subscription_end_date",
  "start_date",
  "end_date",
  "instructor_feedback_date",
  "closed_at",
]);

const STATUS_FILTER_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function isSlug(value: string | undefined): value is CourseEntitySlug {
  return !!value && (COURSE_ENTITY_SLUGS as string[]).includes(value);
}

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

function getCategoryImage(row: CourseRow): string | null {
  const candidates = [row.thumbnail_url, row.thumbnail, row.image_url, row.image, row.photo_url, row.photo];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      const value = candidate.trim();
      if (value === "main_category_icon.svg") continue;
      if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
        return value;
      }
    }
  }
  return null;
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
  const normalized = String(value ?? "").toLowerCase();
  const isActive = normalized === "active";
  const label = normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "—";
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

const CourseEntityList = () => {
  const { hasPermission } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterCourseId, setFilterCourseId] = useState(searchParams.get("course_id") ?? "");
  const [filterClassId, setFilterClassId] = useState(searchParams.get("class_id") ?? "");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<CourseEntityDrawerMode>("create");
  const [drawerEntityId, setDrawerEntityId] = useState<number | null>(null);

  const resolvedSlug = isSlug(slug) ? slug : null;
  const cfg = resolvedSlug ? COURSE_ENTITY_REGISTRY[resolvedSlug] : null;
  const formDef = resolvedSlug ? COURSE_ENTITY_FORM_REGISTRY[resolvedSlug] : null;

  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const extraParams = useMemo(() => {
    const o: Record<string, string> = {};
    if (cfg?.filterParams?.includes("course_id") && filterCourseId.trim()) {
      o.course_id = filterCourseId.trim();
    }
    if (cfg?.filterParams?.includes("class_id") && filterClassId.trim()) {
      o.class_id = filterClassId.trim();
    }
    return o;
  }, [cfg, filterCourseId, filterClassId]);

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

  const { confirm } = useConfirmDialog();
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

  const applyFiltersToUrl = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (filterCourseId.trim()) next.set("course_id", filterCourseId.trim());
    else next.delete("course_id");
    if (filterClassId.trim()) next.set("class_id", filterClassId.trim());
    else next.delete("class_id");
    setSearchParams(next, { replace: true });
  }, [filterCourseId, filterClassId, searchParams, setSearchParams]);

  const tableConfig: DataTableConfig<CourseRow> = useMemo(() => {
    if (!cfg || !resolvedSlug || !formDef) {
      return {
        columns: [],
        rowId: (row) => (typeof row.id === "number" ? row.id : String(row.id ?? "")),
        emptyMessage: "No records found.",
      };
    }
    const deletePerm = coursePermission(cfg.permission, "delete");
    const updatePerm = coursePermission(cfg.permission, "update");
    const statusToggle = formDef.statusToggle;

    const mappedColumns = cfg.columns.map((key) => ({
      key,
      header: key === "main_category_name" ? "Main category" : key.replace(/_/g, " "),
      sortable: key !== "id",
      filterable: key.includes("status"),
      filterOptions: key.includes("status") ? STATUS_FILTER_OPTIONS : undefined,
      render: (row: CourseRow) => {
        if (key === "main_category_name") {
          return getMainCategoryName(row);
        }
        if (key.includes("status")) {
          return <StatusBadge value={row[key]} />;
        }
        if (key === "thumbnail") {
          const title = getTextOrFallback(row.title, "Category");
          const imageUrl = getCategoryImage(row);
          return (
            <div className="flex items-center gap-2">
              {imageUrl ? (
                <img src={imageUrl} alt={title} className="h-9 w-9 rounded-md border border-border object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                  {getTitleInitials(title)}
                </div>
              )}
            </div>
          );
        }

        const v = row[key];
        if (v === null || v === undefined) return "—";
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
              header: "Image",
              sortable: false,
              filterable: false,
              render: (row: CourseRow) => {
                const title = getTextOrFallback(row.title, "Category");
                const imageUrl = getCategoryImage(row);
                return imageUrl ? (
                  <img src={imageUrl} alt={title} className="h-9 w-9 rounded-md border border-border object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    {getTitleInitials(title)}
                  </div>
                );
              },
            },
            ...mappedColumns.slice(1),
          ]
        : mappedColumns;

    return {
      columns,
      rowId: (row) => (typeof row.id === "number" ? row.id : String(row.id ?? "")),
      emptyMessage: "No records found.",
      actions: [
        {
          key: "view",
          label: "View",
          icon: <Eye className="h-4 w-4" />,
          permission: cfg.permission,
          onClick: (row) => {
            const id = row.id;
            const idNum = typeof id === "number" ? id : Number(id);
            const canAct = typeof id === "number" || !Number.isNaN(idNum);
            if (!canAct) return;
            openViewDrawer(typeof id === "number" ? id : idNum);
          },
        },
        {
          key: "edit",
          label: "Edit",
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
        ...(statusToggle
          ? [
              {
                key: "toggle",
                label: (row: CourseRow) => {
                  const cur = String(row[statusToggle.field] ?? "");
                  return cur === statusToggle.activeValue ? "Deactivate" : "Activate";
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
                      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Update failed"),
                    }
                  );
                },
              },
            ]
          : []),
        {
          key: "delete",
          label: "Delete",
          icon: <Trash className="h-4 w-4" />,
          variant: "danger",
          permission: deletePerm,
          onClick: (row) => {
            const id = row.id;
            const idNum = typeof id === "number" ? id : Number(id);
            const canAct = typeof id === "number" || !Number.isNaN(idNum);
            if (!canAct || deleting) return;
            const numericId = typeof id === "number" ? id : idNum;
            void confirm(confirmPresets.delete(cfg.title)).then((ok: boolean) => {
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
    deleteRow,
    deleting,
    patchEntity,
    patching,
    openViewDrawer,
    openEditDrawer,
  ]);

  if (!resolvedSlug || !cfg) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Unknown course entity.</p>
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PageBreadcrumb
            items={[
              { label: "Course", to: "/course" },
              { label: cfg.title },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight">{cfg.title}</h1>
        </div>
        <Can permission={createPerm}>
          <Button type="button" onClick={openCreateDrawer} className="shrink-0 gap-2">
            <Plus className="h-4 w-4 stroke-[1.5]" />
            Add new
          </Button>
        </Can>
      </div>

      {(showCourseFilter || showClassFilter) && (
        <div className="flex flex-wrap items-end gap-3">
          {showCourseFilter && (
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="course-filter">
                Course ID
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
                Class ID
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
            Apply filters
          </Button>
        </div>
      )}

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

      <Drawer open={drawerOpen} onClose={closeDrawer}>
        <DrawerOverlay />
        <DrawerContent>
          <CourseEntityFormDrawer
            slug={resolvedSlug}
            entityTitle={cfg.title}
            mode={drawerMode}
            entityId={drawerEntityId}
            onSuccess={closeDrawer}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default CourseEntityList;
