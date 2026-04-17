import { useMemo, useState, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Ban, CircleCheck, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
  useConfirmDialog,
  confirmPresets,
} from "@/components/ui";
import { Can, useAuth } from "@/features/auth";
import { useDataTableParams } from "@/hooks";
import type { DataTableConfig, DataTablePaginationMeta } from "@/types/datatable";

const TableLoader = () => (
  <div className="flex min-h-[240px] items-center justify-center">
    <div className="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
  </div>
);

function isSlug(value: string | undefined): value is CourseEntitySlug {
  return !!value && (COURSE_ENTITY_SLUGS as string[]).includes(value);
}

function getPaginationFromResponse(response: unknown): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  const meta = (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta;
  return meta?.pagination ?? null;
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
    ...extraParams,
  };

  const { data, isLoading, error } = useCourseEntityList(resolvedSlug, apiParams);
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

    return {
      columns: [
        ...cfg.columns.map((key) => ({
          key,
          header: key.replace(/_/g, " "),
          sortable: key !== "id",
          render: (row: CourseRow) => {
            const v = row[key];
            if (v === null || v === undefined) return "—";
            if (typeof v === "object") return JSON.stringify(v);
            return String(v);
          },
        })),
        {
          key: "actions",
          header: "Actions",
          sortable: false,
          render: (row: CourseRow) => {
            const id = row.id;
            const idNum = typeof id === "number" ? id : Number(id);
            const canAct = typeof id === "number" || !Number.isNaN(idNum);
            const numericId = typeof id === "number" ? id : idNum;

            return (
              <div className="flex flex-wrap items-center gap-1">
                <Can permission={cfg.permission}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!canAct}
                    onClick={() => {
                      if (!canAct) return;
                      openViewDrawer(numericId);
                    }}
                    aria-label="View row"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </Can>
                <Can permission={updatePerm}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!canAct}
                    onClick={() => {
                      if (!canAct) return;
                      openEditDrawer(numericId);
                    }}
                    aria-label="Edit row"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Can>
                {statusToggle ? (
                  <Can permission={updatePerm}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={!canAct || patching}
                      onClick={() => {
                        if (!canAct) return;
                        const cur = String(row[statusToggle.field] ?? "");
                        const nextVal =
                          cur === statusToggle.activeValue
                            ? statusToggle.inactiveValue
                            : statusToggle.activeValue;
                        patchEntity(
                          { id: numericId, body: { [statusToggle.field]: nextVal } },
                          {
                            onSuccess: () => toast.success("Status updated"),
                            onError: (e: unknown) =>
                              toast.error(e instanceof Error ? e.message : "Update failed"),
                          }
                        );
                      }}
                      aria-label={
                        String(row[statusToggle.field] ?? "") === statusToggle.activeValue
                          ? "Disable"
                          : "Enable"
                      }
                    >
                      {String(row[statusToggle.field] ?? "") === statusToggle.activeValue ? (
                        <Ban className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <CircleCheck className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                  </Can>
                ) : null}
                <Can permission={deletePerm}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={deleting || !canAct}
                    onClick={() => {
                      if (!canAct) return;
                      void confirm(confirmPresets.delete(cfg.title)).then((ok: boolean) => {
                        if (ok) deleteRow(numericId);
                      });
                    }}
                    aria-label="Delete row"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Can>
              </div>
            );
          },
        },
      ],
      rowId: (row) => (typeof row.id === "number" ? row.id : String(row.id ?? "")),
      emptyMessage: "No records found.",
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
    return (
      <div className="p-6">
        <p className="text-muted-foreground">You do not have permission to view this dataset.</p>
      </div>
    );
  }

  if (isLoading) {
    return <TableLoader />;
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
          <Link
            to="/course"
            className="text-muted-foreground mb-2 inline-block text-sm hover:text-foreground hover:underline"
          >
            ← Course module
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{cfg.title}</h1>
          <p className="text-muted-foreground text-sm">
            Create, view, edit, enable or disable, and delete records for{" "}
            <code className="text-xs">{cfg.apiPath}</code>
          </p>
        </div>
        <Can permission={createPerm}>
          <Button type="button" onClick={openCreateDrawer} className="shrink-0 gap-2">
            <Plus className="h-4 w-4" />
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
        params={params}
        onParamsChange={updateParams}
        pagination={pagination}
        isLoading={isLoading}
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
