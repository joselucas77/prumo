"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react";
import { cn } from "@/lib/utils";
import { BoxIcon } from "@/components/ui/box-icon";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm transition-colors",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="ml-2 shrink-0 opacity-60">
        <BoxIcon name="chevron-down" className="text-sm" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  sideOffset = 4,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Popup> & {
  sideOffset?: number;
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        sideOffset={sideOffset}
        align="start"
        className="z-50 min-w-[var(--anchor-width)]"
      >
        <SelectPrimitive.Popup
          className={cn(
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl animate-in fade-in-80 zoom-in-95 p-1 focus:outline-none",
            className
          )}
          {...props}
        >
          <SelectPrimitive.List className="p-0.5 space-y-0.5 max-h-72 overflow-y-auto">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.GroupLabel>) {
  return (
    <SelectPrimitive.GroupLabel
      className={cn("py-1.5 pl-8 pr-2 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  value,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
  value: unknown;
}) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:font-semibold data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <BoxIcon name="check" className="text-sm font-bold text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
