"use client";

import * as React from "react";
import { Xmark } from "iconoir-react";
import { cn } from "@/lib/utils";

interface DrawerContextValue {
  open: boolean;
  onClose: () => void;
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Drawer = ({ open, onClose, children }: DrawerProps) => {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return <DrawerContext.Provider value={{ open, onClose }}>{children}</DrawerContext.Provider>;
};

interface DrawerOverlayProps {
  className?: string;
}

const DrawerOverlay = ({ className }: DrawerOverlayProps) => {
  const context = React.useContext(DrawerContext);
  if (!context) return null;
  const { open, onClose } = context;

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity",
        open ? "opacity-100" : "opacity-0",
        className
      )}
      onClick={onClose}
    />
  );
};

interface DrawerContentProps {
  children: React.ReactNode;
  className?: string;
  side?: "left" | "right";
}

const DrawerContent = ({ children, className, side = "right" }: DrawerContentProps) => {
  const context = React.useContext(DrawerContext);
  if (!context) return null;
  const { open } = context;

  return (
    <div
      className={cn(
        "fixed z-50 flex h-full flex-col bg-card shadow-xl transition-transform duration-300 ease-in-out",
        side === "right" ? "right-0 top-0" : "left-0 top-0",
        side === "right"
          ? open
            ? "translate-x-0"
            : "translate-x-full"
          : open
            ? "translate-x-0"
            : "-translate-x-full",
        "w-[35%] min-w-[400px]",
        className
      )}
    >
      {children}
    </div>
  );
};

interface DrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const DrawerHeader = ({ children, className }: DrawerHeaderProps) => {
  const context = React.useContext(DrawerContext);
  if (!context) return null;
  const { onClose } = context;

  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-border px-6 py-4",
        className
      )}
    >
      <div>{children}</div>
      <button
        onClick={onClose}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Xmark className="h-5 w-5" />
      </button>
    </div>
  );
};

interface DrawerBodyProps {
  children: React.ReactNode;
  className?: string;
}

const DrawerBody = ({ children, className }: DrawerBodyProps) => {
  return <div className={cn("flex-1 overflow-y-auto px-6 py-4", className)}>{children}</div>;
};

interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

const DrawerFooter = ({ children, className }: DrawerFooterProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-border px-6 py-4",
        className
      )}
    >
      {children}
    </div>
  );
};

interface DrawerTitleProps {
  children: React.ReactNode;
  className?: string;
}

const DrawerTitle = ({ children, className }: DrawerTitleProps) => {
  return <h2 className={cn("text-lg font-semibold text-foreground", className)}>{children}</h2>;
};

interface DrawerDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const DrawerDescription = ({ children, className }: DrawerDescriptionProps) => {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
};

export {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
