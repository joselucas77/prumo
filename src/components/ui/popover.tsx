"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react";
import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverClose = PopoverPrimitive.Close;

function PopoverContent({
  className,
  positionerClassName,
  align = "center",
  sideOffset = 4,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup> & {
  align?: "start" | "center" | "end";
  sideOffset?: number;
  positionerClassName?: string;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        sideOffset={sideOffset}
        align={align}
        className={cn("z-50", positionerClassName)}
      >
        <PopoverPrimitive.Popup
          className={cn(
            "z-50 w-72 rounded-2xl border bg-popover p-4 text-popover-foreground shadow-xl outline-none animate-in fade-in-80 zoom-in-95",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent, PopoverClose };
