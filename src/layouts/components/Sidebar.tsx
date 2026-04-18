import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  Settings,
  Users,
  Shield,
  Key,
  ChevronDown,
  UserCog,
  BookOpen,
  LayoutGrid,
  List,
} from "lucide-react";
import { useLayoutStore } from "@/store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth";
import {
  buildCourseSidebarRows,
  COURSE_MODULE_ANY_PERMISSIONS,
} from "@/modules/Course/data/courseSidebarNav";
import type { CourseSidebarRow } from "@/modules/Course/data/courseSidebarNav";
import { COURSE_ENTITY_REGISTRY } from "@/modules/Course/data/courseRegistry";

interface NavItem {
  title: string;
  path?: string;
  icon: React.ReactNode;
  permission?: string;
  anyPermission?: string[];
  children?: NavItem[];
  /** Set when children are pre-filtered (e.g. course entity links). */
  skipChildPermissionFilter?: boolean;
  /** Non-clickable subsection heading inside an expanded group. */
  isSectionLabel?: boolean;
  navKey?: string;
}

function linkIsActive(pathname: string, itemPath: string): boolean {
  if (itemPath === "/course") {
    return pathname === "/course";
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function courseRowsToNavItems(rows: CourseSidebarRow[]): NavItem[] {
  return rows.map((row, index) => {
    if (row.kind === "overview") {
      return {
        navKey: "course-overview",
        title: "Overview",
        path: "/course",
        icon: <LayoutGrid className="h-4 w-4" />,
        anyPermission: COURSE_MODULE_ANY_PERMISSIONS,
      };
    }
    if (row.kind === "section") {
      return {
        navKey: `course-section-${row.title}-${index}`,
        title: row.title,
        icon: null,
        isSectionLabel: true,
      };
    }
    const cfg = COURSE_ENTITY_REGISTRY[row.slug];
    return {
      navKey: `course-entity-${row.slug}`,
      title: cfg.title,
      path: `/course/entities/${row.slug}`,
      icon: <List className="h-4 w-4" />,
      permission: cfg.permission,
    };
  });
}

const baseNavItems: NavItem[] = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "User Management",
    icon: <UserCog className="h-5 w-5" />,
    children: [
      {
        title: "Users",
        path: "/users",
        icon: <Users className="h-4 w-4" />,
        permission: "users.read",
      },
      {
        title: "Roles",
        path: "/roles",
        icon: <Shield className="h-4 w-4" />,
        permission: "roles.read",
      },
      {
        title: "Permissions",
        path: "/permissions",
        icon: <Key className="h-4 w-4" />,
        permission: "permissions.read",
      },
    ],
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

const Sidebar = () => {
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useLayoutStore();
  const { hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["User Management", "Courses"]);

  const courseNavChildren = useMemo(
    () => courseRowsToNavItems(buildCourseSidebarRows(hasPermission)),
    [hasPermission]
  );

  const navItems: NavItem[] = useMemo(
    () => [
      baseNavItems[0],
      {
        title: "Courses",
        icon: <BookOpen className="h-5 w-5" />,
        anyPermission: COURSE_MODULE_ANY_PERMISSIONS,
        children: courseNavChildren,
        skipChildPermissionFilter: true,
      },
      ...baseNavItems.slice(1),
    ],
    [courseNavChildren]
  );

  const isChildActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some(
      (child) =>
        child.path &&
        !child.isSectionLabel &&
        linkIsActive(location.pathname, child.path)
    );
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) =>
      prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title]
    );
  };

  const filterByPermission = (items: NavItem[]): NavItem[] => {
    return items
      .map((item) => {
        if (item.skipChildPermissionFilter && item.children) {
          if (item.anyPermission?.length && !hasAnyPermission(item.anyPermission)) {
            return null;
          }
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }
          if (item.children.length === 0) {
            return null;
          }
          return item;
        }
        if (item.children) {
          const filteredChildren = filterByPermission(item.children);
          if (filteredChildren.length === 0) return null;
          return { ...item, children: filteredChildren };
        }
        if (item.anyPermission?.length) {
          if (!hasAnyPermission(item.anyPermission)) return null;
        } else if (item.permission && !hasPermission(item.permission)) {
          return null;
        }
        return item;
      })
      .filter(Boolean) as NavItem[];
  };

  const visibleNavItems = filterByPermission(navItems);

  const renderNavItem = (item: NavItem, isChild = false) => {
    if (item.isSectionLabel) {
      return (
        <li key={item.navKey ?? item.title}>
          <div className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {item.title}
          </div>
        </li>
      );
    }

    if (item.children) {
      const isExpanded = expandedGroups.includes(item.title);
      const hasActiveChild = isChildActive(item.children);

      return (
        <li key={item.title}>
          <button
            type="button"
            onClick={() => toggleGroup(item.title)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              hasActiveChild
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              sidebarCollapsed && "lg:justify-center lg:px-2"
            )}
          >
            {item.icon}
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left">{item.title}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </>
            )}
          </button>

          {!sidebarCollapsed && isExpanded && (
            <ul className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
              {item.children.map((child) => renderNavItem(child, true))}
            </ul>
          )}
        </li>
      );
    }

    const isActive = item.path ? linkIsActive(location.pathname, item.path) : false;
    return (
      <li key={item.navKey ?? item.path}>
        <NavLink
          to={item.path!}
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
            isChild ? "py-2" : "py-2.5",
            isActive
              ? "bg-primary text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            sidebarCollapsed && "lg:justify-center lg:px-2"
          )}
        >
          {item.icon}
          {!sidebarCollapsed && <span className="min-w-0 flex-1 leading-snug">{item.title}</span>}
        </NavLink>
      </li>
    );
  };

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border bg-card transition-all duration-300",
          "lg:z-20",
          sidebarCollapsed ? "lg:w-20" : "lg:w-64",
          "w-64 -translate-x-full lg:translate-x-0",
          mobileMenuOpen && "translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
              R
            </div>
            {!sidebarCollapsed && <span className="text-lg font-bold text-foreground">Raad LMS</span>}
          </NavLink>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 hover:bg-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">{visibleNavItems.map((item) => renderNavItem(item))}</ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div
            className={cn("text-xs text-muted-foreground", sidebarCollapsed && "lg:text-center")}
          >
            {sidebarCollapsed ? "v1.0" : "Version 1.0.0"}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
