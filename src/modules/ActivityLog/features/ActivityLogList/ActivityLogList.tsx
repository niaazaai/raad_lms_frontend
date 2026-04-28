import { useCallback, useState } from "react";
import { Eye, PageSearch } from "iconoir-react";
import { useActivityLogs } from "../../hooks/useActivityLogs";
import type { UserActivityLogEntry } from "../../data/models/activityLog";
import {
  Button,
  Card,
  CardContent,
  DataTable,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Input,
  Label,
} from "@/components/ui";
import { useDataTableParams } from "@/hooks";
import type { DataTableConfig, DataTablePaginationMeta } from "@/types/datatable";

function getListFromResponse(response: unknown): UserActivityLogEntry[] {
  if (!response || typeof response !== "object") return [];
  const r = response as { data?: UserActivityLogEntry[] | { data?: UserActivityLogEntry[] } };
  const inner = r.data;
  if (Array.isArray(inner)) return inner;
  if (inner && typeof inner === "object" && Array.isArray((inner as { data?: UserActivityLogEntry[] }).data)) {
    return (inner as { data: UserActivityLogEntry[] }).data;
  }
  return [];
}

function getPaginationFromResponse(response: unknown): DataTablePaginationMeta | null {
  if (!response || typeof response !== "object") return null;
  const meta = (response as { meta?: { pagination?: DataTablePaginationMeta } }).meta;
  return meta?.pagination ?? null;
}

function formatDt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const ActivityLogList = () => {
  const { params, debouncedSearch, updateParams, setFilter } = useDataTableParams({
    defaultPageSize: 15,
    defaultSortBy: "occurred_at",
    defaultSortDir: "desc",
    searchDebounceMs: 400,
  });

  const actorId = params.filters.actor_user_id;
  const actionFilter = params.filters.action;
  const subjectType = params.filters.subject_type;
  const occurredFrom = params.filters.occurred_from;
  const occurredUntil = params.filters.occurred_until;

  const apiParams: Record<string, unknown> = {
    search: debouncedSearch || undefined,
    page: params.page,
    per_page: params.per_page,
    sort_by: params.sort_by,
    sort_dir: params.sort_dir,
  };

  if (typeof actorId === "number" && !Number.isNaN(actorId)) {
    apiParams.actor_user_id = actorId;
  }

  if (typeof actionFilter === "string" && actionFilter.trim() !== "") {
    apiParams.action = actionFilter.trim();
  }

  if (typeof subjectType === "string" && subjectType.trim() !== "") {
    apiParams.subject_type = subjectType.trim();
  }

  if (typeof occurredFrom === "string" && occurredFrom.trim() !== "") {
    apiParams.occurred_from = occurredFrom;
  }

  if (typeof occurredUntil === "string" && occurredUntil.trim() !== "") {
    apiParams.occurred_until = occurredUntil;
  }

  const { data, isLoading, error } = useActivityLogs(apiParams);
  const rows = getListFromResponse(data);
  const pagination = getPaginationFromResponse(data);

  const [detailOpen, setDetailOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<UserActivityLogEntry | null>(null);

  const openDetail = useCallback((row: UserActivityLogEntry) => {
    setActiveRow(row);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setActiveRow(null);
  }, []);

  const config: DataTableConfig<UserActivityLogEntry> = {
    columns: [
      {
        key: "occurred_at",
        header: "When",
        render: (row) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">{formatDt(row.occurred_at)}</span>
        ),
        sortable: true,
      },
      {
        key: "actor",
        header: "Who",
        render: (row) =>
          row.actor ? (
            <div>
              <p className="font-medium text-foreground">{row.actor.name}</p>
              <p className="text-xs text-muted-foreground">{row.actor.email}</p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">System</span>
          ),
      },
      {
        key: "action",
        header: "Action",
        render: (row) => (
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">{row.action}</span>
        ),
        sortable: true,
      },
      {
        key: "subject",
        header: "Subject",
        render: (row) => (
          <div className="max-w-[220px]">
            <p className="truncate font-mono text-xs text-muted-foreground" title={row.subject_type ?? undefined}>
              {row.subject_type ?? "—"}
            </p>
            {row.subject_id != null ? <p className="text-xs text-muted-foreground">ID {row.subject_id}</p> : null}
          </div>
        ),
      },
      {
        key: "summary",
        header: "Summary",
        render: (row) => (
          <p className="line-clamp-2 max-w-md text-sm text-foreground" title={row.summary}>
            {row.summary}
          </p>
        ),
      },
    ],
    rowId: (row) => row.id,
    searchable: true,
    searchPlaceholder: "Search summary…",
    filtersEnabled: false,
    paginationEnabled: true,
    defaultPageSize: 15,
    pageSizeOptions: [15, 25, 50, 100],
    emptyMessage: "No activity recorded yet.",
    actions: [
      {
        key: "view",
        label: "View",
        icon: <Eye className="h-4 w-4" />,
        onClick: (row) => openDetail(row),
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <PageSearch className="h-8 w-8 text-primary" strokeWidth={1.5} />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity log</h1>
            <p className="text-muted-foreground">
              Audit trail for the LMS — visible only to super administrators (root).
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="audit-actor-id">Actor user ID</Label>
              <Input
                id="audit-actor-id"
                type="number"
                min={1}
                placeholder="Optional"
                value={typeof actorId === "number" && !Number.isNaN(actorId) ? String(actorId) : ""}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") {
                    setFilter("actor_user_id", undefined);
                    return;
                  }
                  const n = Number.parseInt(raw, 10);
                  setFilter("actor_user_id", Number.isNaN(n) ? undefined : n);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-action">Action</Label>
              <Input
                id="audit-action"
                placeholder="e.g. updated"
                value={typeof actionFilter === "string" ? actionFilter : ""}
                onChange={(e) => setFilter("action", e.target.value || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-subject-type">Subject type</Label>
              <Input
                id="audit-subject-type"
                placeholder="Exact morph type key"
                value={typeof subjectType === "string" ? subjectType : ""}
                onChange={(e) => setFilter("subject_type", e.target.value || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-from">Occurred from</Label>
              <Input
                id="audit-from"
                type="date"
                value={typeof occurredFrom === "string" ? occurredFrom.slice(0, 10) : ""}
                onChange={(e) => setFilter("occurred_from", e.target.value || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-until">Occurred until</Label>
              <Input
                id="audit-until"
                type="date"
                value={typeof occurredUntil === "string" ? occurredUntil.slice(0, 10) : ""}
                onChange={(e) => setFilter("occurred_until", e.target.value || undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-lg border border-danger/20 bg-light-danger p-6 text-center">
          <p className="text-danger">
            Could not load activity log. You may not have permission, or the session expired.
          </p>
        </div>
      ) : (
        <DataTable
          data={rows}
          config={config}
          params={params}
          onParamsChange={updateParams}
          pagination={pagination}
          isLoading={isLoading}
        />
      )}

      <Drawer open={detailOpen} onClose={closeDetail}>
        <DrawerOverlay />
        <DrawerContent className="max-h-[92vh] max-w-xl overflow-auto">
          {activeRow ? (
            <div className="space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold">Entry #{activeRow.id}</h2>
                <p className="text-sm text-muted-foreground">{formatDt(activeRow.occurred_at)}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</h3>
                <p className="mt-1 text-sm leading-relaxed">{activeRow.summary}</p>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Action</span>
                  <span className="font-mono">{activeRow.action}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Subject</span>
                  <span className="max-w-[60%] text-right font-mono text-xs leading-snug">
                    {(activeRow.subject_type ?? "—") + (activeRow.subject_id != null ? ` #${activeRow.subject_id}` : "")}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Actor</span>
                  <span className="max-w-[60%] text-right text-xs">
                    {activeRow.actor ? (
                      <>
                        <span className="block font-medium text-foreground">{activeRow.actor.name}</span>
                        <span className="block text-muted-foreground">{activeRow.actor.email}</span>
                      </>
                    ) : (
                      "System"
                    )}
                  </span>
                </div>
                {activeRow.ip_address ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">IP</span>
                    <span>{activeRow.ip_address}</span>
                  </div>
                ) : null}
              </div>
              {activeRow.user_agent ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">User agent</h3>
                  <p className="mt-1 break-all font-mono text-[11px] leading-snug text-muted-foreground">
                    {activeRow.user_agent}
                  </p>
                </div>
              ) : null}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meta (JSON)</h3>
                <pre className="mt-2 max-h-72 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
                  {JSON.stringify(activeRow.meta ?? null, null, 2)}
                </pre>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={closeDetail}>
                Close
              </Button>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ActivityLogList;
