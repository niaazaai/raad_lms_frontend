import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HomeSimple,
  Settings,
  User,
  Shield,
  Key,
  BookStack,
  NavArrowDown,
  Xmark,
  Community,
  PageSearch,
  Hat,
} from "iconoir-react";
import { useLayoutStore } from "@/store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth";
import {
  buildCourseSidebarRows,
  COURSE_MODULE_ANY_PERMISSIONS,
} from "@/modules/Course/data/courseSidebarNav";
import type { CourseSidebarRow } from "@/modules/Course/data/courseSidebarNav";
import { COURSE_ENTITY_REGISTRY } from "@/modules/Course/data/courseRegistry";
import {
  CourseEntitySidebarIcon,
  CourseOverviewIcon,
} from "@/modules/Course/data/courseEntitySidebarIcons";

interface NavItem {
  title: string;
  path?: string;
  icon: React.ReactNode;
  permission?: string;
  anyPermission?: string[];
  /** Spatie role name(s); e.g. activity log visible only with `root`. */
  anyRole?: string[];
  children?: NavItem[];
  skipChildPermissionFilter?: boolean;
  navKey?: string;
}

function linkIsActive(pathname: string, itemPath: string): boolean {
  if (itemPath === "/course") {
    return pathname === "/course";
  }
  if (itemPath === "/instructors") {
    return pathname === "/instructors";
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
        icon: <CourseOverviewIcon />,
        anyPermission: COURSE_MODULE_ANY_PERMISSIONS,
      };
    }
    const cfg = COURSE_ENTITY_REGISTRY[row.slug];
    const path = row.slug === "courses" ? "/course/courses" : `/course/${row.slug}`;
    return {
      navKey: `course-entity-${row.slug}-${index}`,
      title: cfg.title,
      path,
      icon: <CourseEntitySidebarIcon slug={row.slug} />,
      permission: cfg.permission,
    };
  });
}

const baseNavItems: NavItem[] = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: <HomeSimple className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />,
  },
  {
    title: "User Management",
    icon: <Community className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />,
    children: [
      {
        title: "Activity log",
        path: "/activity-log",
        icon: <PageSearch className="h-4 w-4 shrink-0 stroke-[1.5]" />,
        anyRole: ["root"],
      },
      {
        title: "Users",
        path: "/users",
        icon: <User className="h-4 w-4 shrink-0 stroke-[1.5]" />,
        permission: "users.read",
      },
      {
        title: "Roles",
        path: "/roles",
        icon: <Shield className="h-4 w-4 shrink-0 stroke-[1.5]" />,
        permission: "roles.read",
      },
      {
        title: "Permissions",
        path: "/permissions",
        icon: <Key className="h-4 w-4 shrink-0 stroke-[1.5]" />,
        permission: "permissions.read",
      },
    ],
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <Settings className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />,
  },
];

const Sidebar = () => {
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useLayoutStore();
  const { hasPermission, hasAnyPermission, hasAnyRole } = useAuth();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const courseNavChildren = useMemo(
    () => courseRowsToNavItems(buildCourseSidebarRows(hasPermission)),
    [hasPermission]
  );

  const navItems: NavItem[] = useMemo(
    () => [
      baseNavItems[0],
      {
        title: "Courses",
        icon: <BookStack className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />,
        anyPermission: COURSE_MODULE_ANY_PERMISSIONS,
        children: courseNavChildren,
        skipChildPermissionFilter: true,
      },
      {
        title: "Instructors",
        path: "/instructors",
        icon: <Hat className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />,
        permission: COURSE_ENTITY_REGISTRY.instructors.permission,
      },
      ...baseNavItems.slice(1),
    ],
    [courseNavChildren]
  );

  const isChildActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some((child) => child.path && linkIsActive(location.pathname, child.path));
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
        if (item.anyRole?.length && !hasAnyRole(item.anyRole)) {
          return null;
        }
        return item;
      })
      .filter(Boolean) as NavItem[];
  };

  const visibleNavItems = filterByPermission(navItems);

  const renderNavItem = (item: NavItem, isChild = false) => {
    if (item.children) {
      const isExpanded = expandedGroups.includes(item.title);
      const hasActiveChild = isChildActive(item.children);

      return (
        <li key={item.title}>
          <button
            type="button"
            onClick={() => toggleGroup(item.title)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-medium transition-colors",
              hasActiveChild
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              sidebarCollapsed && "lg:justify-center lg:px-1.5"
            )}
          >
            {item.icon}
            {!sidebarCollapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
                <NavArrowDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </>
            )}
          </button>

          {!sidebarCollapsed && isExpanded && (
            <ul className="mt-0.5 space-y-0.5 border-l border-border/80 pl-2.5 ml-1.5">
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
            "flex items-center gap-2 rounded-md px-2 text-xs font-medium transition-colors",
            isChild ? "py-1.5" : "py-2",
            isActive
              ? "bg-primary text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            sidebarCollapsed && "lg:justify-center lg:px-1.5"
          )}
        >
          {item.icon}
          {!sidebarCollapsed && (
            <span className="min-w-0 flex-1 truncate leading-snug">{item.title}</span>
          )}
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
          sidebarCollapsed ? "lg:w-[4.25rem]" : "lg:w-52",
          "w-52 -translate-x-full lg:translate-x-0",
          mobileMenuOpen && "translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-2.5">
          <NavLink
            to="/dashboard"
            className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60"
          >
            <div className="flex w-30 shrink-0 items-center justify-center">
              <img src="/logo.png" alt="RAAD LMS" className="h-10 object-contain" />
            </div>
          </NavLink>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-md p-1.5 hover:bg-muted lg:hidden"
            aria-label="Close menu"
          >
            <Xmark className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2.5">
          <ul className="space-y-0.5">{visibleNavItems.map((item) => renderNavItem(item))}</ul>
        </nav>

        <div className="border-t border-border p-2.5">
          <div
            className={cn(
              "text-[10px] text-muted-foreground",
              sidebarCollapsed && "lg:text-center"
            )}
          >
            {sidebarCollapsed ? "v1" : "v1.0.0"}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
