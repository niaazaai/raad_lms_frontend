import { useRef, useEffect } from "react";
import { DoubleCheck } from "iconoir-react";
import { Spinner } from "@/components/ui/spinner";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkAllNotificationsRead,
  type Notification,
} from "../hooks/useNotifications";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

const NotificationDropdown = ({ isOpen, onClose, anchorRef }: NotificationDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications({ per_page: 10 });
  const { data: countData } = useUnreadNotificationCount();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const responseData = data as { data?: Notification[] } | undefined;
  const notifications = responseData?.data ?? [];
  const countResponse = countData as { data?: { count?: number } } | undefined;
  const unreadCount = countResponse?.data?.count ?? 0;

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate(undefined)}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-active"
          >
            {markAllRead.isPending ? (
              <Spinner className="h-3 w-3" />
            ) : (
              <DoubleCheck className="h-3 w-3" />
            )}
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6 text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "px-4 py-3 transition-colors hover:bg-muted/50",
                  !n.read_at && "bg-primary/5"
                )}
              >
                <div className="text-sm">
                  <p className="font-medium">{n.data?.title ?? "Notification"}</p>
                  <p className="mt-0.5 text-muted-foreground">{n.data?.message ?? ""}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
