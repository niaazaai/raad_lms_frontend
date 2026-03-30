import { Menu, Bell, User, LogOut, Settings, Sun, Moon, RefreshCw } from "lucide-react";
import { useLayoutStore } from "@/store";
import { useAuth } from "@/features/auth";
import { ThemeMode } from "@/data/enums";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import NotificationDropdown from "@/modules/Notifications/components/NotificationDropdown";
import { useUnreadNotificationCount } from "@/modules/Notifications/hooks/useNotifications";

const NotificationBadgeCount = () => {
  const { user } = useAuth();
  const { data } = useUnreadNotificationCount(!!user);
  const count = (data as { data?: { count?: number } })?.data?.count ?? 0;
  if (count === 0) return null;
  return (
    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
};

/**
 * Header Component
 *
 * Top navigation bar with:
 * - Mobile menu toggle
 * - Search
 * - Notifications
 * - User menu
 * - Theme toggle
 */
const Header = () => {
  const { sidebarCollapsed, toggleSidebar, theme, setTheme, setMobileMenuOpen } = useLayoutStore();
  const { user, logout, fetchUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationBtnRef = useRef<HTMLButtonElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const handleRefreshPermissions = async () => {
    setIsRefreshing(true);
    setUserMenuOpen(false);
    await fetchUser();
    setIsRefreshing(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
    setTheme(newTheme);
  };

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 transition-all duration-300",
        sidebarCollapsed ? "lg:left-20" : "lg:left-64"
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-lg p-2 hover:bg-muted lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden rounded-lg p-2 hover:bg-muted lg:block"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 hover:bg-muted"
          aria-label="Toggle theme"
        >
          {theme === ThemeMode.DARK ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            ref={notificationBtnRef}
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative rounded-lg p-2 hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <NotificationBadgeCount />
          </button>
          <NotificationDropdown
            isOpen={notificationOpen}
            onClose={() => setNotificationOpen(false)}
            anchorRef={notificationBtnRef}
          />
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="hidden text-sm font-medium md:block">{user?.name || "User"}</span>
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-card py-2 shadow-lg">
              {/* User Info */}
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <a
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted"
                >
                  <User className="h-4 w-4" />
                  Profile
                </a>
                <button
                  type="button"
                  onClick={handleRefreshPermissions}
                  disabled={isRefreshing}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  {isRefreshing ? "Refreshing..." : "Sync Permissions"}
                </button>
                <a
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </a>
              </div>

              {/* Logout */}
              <div className="border-t border-border pt-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
