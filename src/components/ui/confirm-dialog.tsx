"use client";

import * as React from "react";
import { WarningTriangle, Trash, InfoCircle, CheckCircle, Xmark } from "iconoir-react";
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// ============================================
// Types
// ============================================

export type ConfirmVariant = "danger" | "warning" | "info" | "success";

export interface ConfirmDialogOptions {
  title: string;
  message: string | React.ReactNode;
  variant?: ConfirmVariant;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

// ============================================
// Context
// ============================================

interface ConfirmDialogContextType {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  alert: (options: Omit<ConfirmDialogOptions, "cancelText">) => Promise<void>;
}

const ConfirmDialogContext = React.createContext<ConfirmDialogContextType | null>(null);

// ============================================
// Hook
// ============================================

export function useConfirmDialog() {
  const context = React.useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }
  return context;
}

// ============================================
// Provider
// ============================================

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmDialogState | null>(null);
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        ...options,
        isOpen: true,
        isLoading: false,
        onConfirm: async () => {
          setState((prev) => (prev ? { ...prev, isLoading: true } : null));
          resolve(true);
          setState(null);
        },
        onCancel: () => {
          resolve(false);
          setState(null);
        },
      });
    });
  }, []);

  const alert = React.useCallback(
    (options: Omit<ConfirmDialogOptions, "cancelText">): Promise<void> => {
      return new Promise((resolve) => {
        setState({
          ...options,
          cancelText: undefined,
          isOpen: true,
          isLoading: false,
          onConfirm: () => {
            resolve();
            setState(null);
          },
          onCancel: () => {
            resolve();
            setState(null);
          },
        });
      });
    },
    []
  );

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state?.isOpen) {
        state.onCancel();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [state]);

  return (
    <ConfirmDialogContext.Provider value={{ confirm, alert }}>
      {children}
      {state?.isOpen && <ConfirmDialogComponent {...state} />}
    </ConfirmDialogContext.Provider>
  );
}

// ============================================
// Dialog Component
// ============================================

const variantConfig: Record<
  ConfirmVariant,
  { icon: React.ReactNode; iconBg: string; iconColor: string; buttonVariant: string }
> = {
  danger: {
    icon: <Trash className="h-6 w-6" />,
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
    buttonVariant: "destructive",
  },
  warning: {
    icon: <WarningTriangle className="h-6 w-6" />,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    buttonVariant: "warning",
  },
  info: {
    icon: <InfoCircle className="h-6 w-6" />,
    iconBg: "bg-info/10",
    iconColor: "text-info",
    buttonVariant: "default",
  },
  success: {
    icon: <CheckCircle className="h-6 w-6" />,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    buttonVariant: "default",
  },
};

function ConfirmDialogComponent({
  title,
  message,
  variant = "danger",
  confirmText = "Confirm",
  cancelText,
  icon,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogState) {
  const config = variantConfig[variant];
  const displayIcon = icon || config.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95">
        <div className="rounded-xl border border-border bg-card shadow-xl">
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Xmark className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div
              className={cn(
                "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full",
                config.iconBg,
                config.iconColor
              )}
            >
              {displayIcon}
            </div>

            {/* Title */}
            <h3 className="mb-2 text-center text-lg font-semibold text-foreground">{title}</h3>

            {/* Message */}
            <div className="text-center text-sm text-muted-foreground">{message}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
            {cancelText && (
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                {cancelText}
              </Button>
            )}
            <Button
              variant={config.buttonVariant as any}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Please wait...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// Preset Dialogs (Convenience Functions)
// ============================================

/**
 * Preset confirm options for common use cases
 */
export const confirmPresets = {
  delete: (itemName: string = "item"): ConfirmDialogOptions => ({
    title: "Delete " + itemName + "?",
    message: `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
    variant: "danger",
    confirmText: "Delete",
    cancelText: "Cancel",
  }),

  disable: (itemName: string = "item"): ConfirmDialogOptions => ({
    title: "Disable " + itemName + "?",
    message: `Are you sure you want to disable this ${itemName.toLowerCase()}? It will no longer be active.`,
    variant: "warning",
    confirmText: "Disable",
    cancelText: "Cancel",
  }),

  enable: (itemName: string = "item"): ConfirmDialogOptions => ({
    title: "Enable " + itemName + "?",
    message: `Are you sure you want to enable this ${itemName.toLowerCase()}?`,
    variant: "success",
    confirmText: "Enable",
    cancelText: "Cancel",
  }),

  suspend: (itemName: string = "item"): ConfirmDialogOptions => ({
    title: "Suspend " + itemName + "?",
    message: `Are you sure you want to suspend this ${itemName.toLowerCase()}? They will not be able to sign in until activated.`,
    variant: "warning",
    confirmText: "Suspend",
    cancelText: "Cancel",
  }),

  activate: (itemName: string = "item"): ConfirmDialogOptions => ({
    title: "Activate " + itemName + "?",
    message: `Are you sure you want to activate this ${itemName.toLowerCase()}? They will be able to sign in again.`,
    variant: "success",
    confirmText: "Activate",
    cancelText: "Cancel",
  }),

  unsavedChanges: (): ConfirmDialogOptions => ({
    title: "Unsaved Changes",
    message: "You have unsaved changes. Are you sure you want to leave? Your changes will be lost.",
    variant: "warning",
    confirmText: "Leave",
    cancelText: "Stay",
  }),

  logout: (): ConfirmDialogOptions => ({
    title: "Log Out?",
    message: "Are you sure you want to log out of your account?",
    variant: "info",
    confirmText: "Log Out",
    cancelText: "Cancel",
  }),
};

/**
 * Preset alert options for common use cases
 */
export const alertPresets = {
  success: (message: string): Omit<ConfirmDialogOptions, "cancelText"> => ({
    title: "Success",
    message,
    variant: "success",
    confirmText: "OK",
  }),

  error: (message: string): Omit<ConfirmDialogOptions, "cancelText"> => ({
    title: "Error",
    message,
    variant: "danger",
    confirmText: "OK",
  }),

  warning: (message: string): Omit<ConfirmDialogOptions, "cancelText"> => ({
    title: "Warning",
    message,
    variant: "warning",
    confirmText: "OK",
  }),

  info: (message: string): Omit<ConfirmDialogOptions, "cancelText"> => ({
    title: "Information",
    message,
    variant: "info",
    confirmText: "OK",
  }),
};
