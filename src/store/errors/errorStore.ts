import { create } from "zustand";

/**
 * Error item structure
 */
export interface ErrorItem {
  id: string;
  message: string;
  type: "error" | "warning" | "info";
  timestamp: Date;
  context?: string;
}

/**
 * Error store state interface
 */
export interface ErrorState {
  errors: ErrorItem[];
  lastError: ErrorItem | null;

  // Actions
  addError: (message: string, type?: ErrorItem["type"], context?: string) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  clearErrorsByContext: (context: string) => void;
}

/**
 * Generate unique ID for errors
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Error store using Zustand
 *
 * Manages application errors for:
 * - Displaying error notifications
 * - Error tracking and debugging
 * - Context-specific error clearing
 */
export const useErrorStore = create<ErrorState>()((set) => ({
  errors: [],
  lastError: null,

  addError: (message, type = "error", context) => {
    const newError: ErrorItem = {
      id: generateId(),
      message,
      type,
      timestamp: new Date(),
      context,
    };

    set((state) => ({
      errors: [...state.errors, newError],
      lastError: newError,
    }));

    // Auto-remove errors after 10 seconds
    setTimeout(() => {
      set((state) => ({
        errors: state.errors.filter((e) => e.id !== newError.id),
      }));
    }, 10000);
  },

  removeError: (id) => {
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    }));
  },

  clearErrors: () => {
    set({ errors: [], lastError: null });
  },

  clearErrorsByContext: (context) => {
    set((state) => ({
      errors: state.errors.filter((e) => e.context !== context),
    }));
  },
}));
