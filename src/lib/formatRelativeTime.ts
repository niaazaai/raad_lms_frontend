import { formatDistanceToNow } from "date-fns";

/** Human-readable relative time for ISO-like timestamps (e.g. `created_at`). */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (iso === null || iso === undefined || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return formatDistanceToNow(d, { addSuffix: true });
}
