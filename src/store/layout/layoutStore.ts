import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ThemeMode } from "@/data/enums";

/**
 * Layout store state interface
 */
export interface LayoutState {
  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Page title
  pageTitle: string;
  setPageTitle: (title: string) => void;

  // Loading states
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
}

/**
 * Layout store using Zustand with persistence
 *
 * Manages UI layout state including:
 * - Theme (light/dark/system)
 * - Sidebar state
 * - Mobile menu
 * - Page title
 */
export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      // Theme - default to system
      theme: ThemeMode.SYSTEM,
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      // Sidebar state
      sidebarOpen: true,
      sidebarCollapsed: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      // Mobile menu
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      // Page title
      pageTitle: "",
      setPageTitle: (title) => set({ pageTitle: title }),

      // Loading
      isPageLoading: false,
      setPageLoading: (loading) => set({ isPageLoading: loading }),
    }),
    {
      name: "raad-lms-layout",
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

/**
 * Apply theme to the document
 */
function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;

  if (theme === ThemeMode.SYSTEM) {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? ThemeMode.DARK
      : ThemeMode.LIGHT;
    root.classList.toggle("dark", systemTheme === ThemeMode.DARK);
  } else {
    root.classList.toggle("dark", theme === ThemeMode.DARK);
  }
}

/**
 * Initialize theme on app load
 */
export function initializeTheme(): void {
  const state = useLayoutStore.getState();
  applyTheme(state.theme);

  // Listen for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", () => {
    if (useLayoutStore.getState().theme === ThemeMode.SYSTEM) {
      applyTheme(ThemeMode.SYSTEM);
    }
  });
}
