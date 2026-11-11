"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react";
import { cn } from "@/lib/utils";

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

function AlertDialogBackdrop({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Backdrop>) {
  return (
    <AlertDialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Popup>) {
  return (
    <AlertDialogPortal>
      <AlertDialogBackdrop />
      <AlertDialogPrimitive.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <AlertDialogPrimitive.Popup
          className={cn(
            "relative z-50 w-full max-w-lg overflow-hidden rounded-2xl border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200 focus:outline-none",
            className
          )}
          {...props}
        >
          {children}
        </AlertDialogPrimitive.Popup>
      </AlertDialogPrimitive.Viewport>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-5",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={cn("text-lg font-bold text-foreground leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Close>) {
  return (
    <AlertDialogPrimitive.Close
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-sm font-semibold hover:bg-destructive/90 transition-colors cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Close>) {
  return (
    <AlertDialogPrimitive.Close
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
