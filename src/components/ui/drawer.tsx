"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />
      {/* Drawer Shell */}
      <div className="relative z-50 flex flex-col w-full max-h-[92dvh] rounded-t-3xl border-t bg-background shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
        {/* Drag handle */}
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30 shrink-0" />
        {children}
      </div>
    </div>
  );
}

export function DrawerHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1 px-4 py-3.5 border-b shrink-0 text-center", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DrawerTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-bold leading-none tracking-tight", className)} {...props}>
      {children}
    </h2>
  );
}

export function DrawerDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-muted-foreground mt-1", className)} {...props}>
      {children}
    </p>
  );
}
