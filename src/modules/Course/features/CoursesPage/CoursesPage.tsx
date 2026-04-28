import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Plus, ViewGrid, List, Eye, EditPencil } from "iconoir-react";
import {
  Button,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useDataTableParams } from "@/hooks";
import { Can, useAuth } from "@/features/auth";
import type { DataTableConfig, DataTablePaginationMeta } from "@/types/datatable";
import { COURSE_ENTITY_REGISTRY } from "../../data/courseRegistry";
import {
  getCourseListFromResponse,
  type CourseRow,
  useCourseEntityList,
} from "../../hooks/useCourseEntity";

const CoursesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const { params, debouncedSearch, updateParams } = useDataTableParams({
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const apiParams = {
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  };

  const { data, isFetching } = useCourseEntityList("courses", apiParams);
  const rows = getCourseListFromResponse(data);
  const pagination = (data as { meta?: { pagination?: DataTablePaginationMeta } } | undefined)?.meta
    ?.pagination;

  const tableConfig: DataTableConfig<CourseRow> = useMemo(
    () => ({
      columns: [
        {
          key: "title",
          header: "Title",
          sortable: true,
          render: (row) => String(row.title ?? "—"),
        },
        {
          key: "language",
          header: "Language",
          sortable: true,
          render: (row) => String(row.language ?? "—"),
        },
        {
          key: "level",
          header: "Level",
          sortable: true,
          render: (row) => String(row.level ?? "—"),
        },
        {
          key: "price",
          header: "Price",
          sortable: true,
          render: (row) => String(row.price ?? "—"),
        },
        {
          key: "status",
          header: "Status",
          sortable: true,
          render: (row) => String(row.status ?? "—"),
        },
      ],
      rowId: (row) => (typeof row.id === "number" ? row.id : String(row.id ?? "")),
      searchable: true,
      searchPlaceholder: "Search courses...",
      emptyMessage: "No courses found.",
      actions: [
        {
          key: "view",
          label: "View",
          icon: <Eye className="h-4 w-4" />,
          permission: "course.courses.read",
          onClick: (row) => {
            const id = Number(row.id);
            if (!Number.isNaN(id)) navigate(`/course/courses/${id}/edit?mode=view`);
          },
        },
        {
          key: "edit",
          label: "Edit",
          icon: <EditPencil className="h-4 w-4" />,
          permission: "course.courses.update",
          onClick: (row) => {
            const id = Number(row.id);
            if (!Number.isNaN(id)) navigate(`/course/courses/${id}/edit`);
          },
        },
      ],
    }),
    [navigate]
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">
            {COURSE_ENTITY_REGISTRY.courses.pageDescription}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border p-1">
            <button
              type="button"
              className={`rounded px-2 py-1 text-xs ${viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground"}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 text-xs ${viewMode === "card" ? "bg-primary text-white" : "text-muted-foreground"}`}
              onClick={() => setViewMode("card")}
            >
              <ViewGrid className="h-4 w-4" />
            </button>
          </div>
          <Can permission="course.courses.create">
            <Button onClick={() => navigate("/course/courses/create")} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </Can>
        </div>
      </div>

      {viewMode === "list" ? (
        <DataTable<CourseRow>
          data={rows}
          config={tableConfig}
          params={params}
          onParamsChange={updateParams}
          pagination={pagination}
          isLoading={isFetching}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const id = Number(row.id);
            return (
              <div
                key={String(row.id)}
                className="rounded-lg border border-border bg-card p-4 space-y-2"
              >
                <h3 className="font-semibold">{String(row.title ?? "Untitled Course")}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {String(row.short_description ?? row.long_description ?? "No description")}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{String(row.level ?? "—")}</span>
                  <span>{String(row.language ?? "—")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{String(row.price ?? "—")}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {hasPermission("course.courses.read") && (
                        <DropdownMenuItem
                          onClick={() =>
                            !Number.isNaN(id) && navigate(`/course/courses/${id}/edit?mode=view`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                      )}
                      {hasPermission("course.courses.update") && (
                        <DropdownMenuItem
                          onClick={() =>
                            !Number.isNaN(id) && navigate(`/course/courses/${id}/edit`)
                          }
                        >
                          <EditPencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NavLink to="/course" className="text-xs text-muted-foreground hover:text-foreground">
        Back to course hub
      </NavLink>
    </div>
  );
};

export default CoursesPage;
