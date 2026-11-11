import * as React from "react";
import { cn } from "@/lib/utils";

export interface BoxIconProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  solid?: boolean;
  className?: string;
}

export function BoxIcon({ name, solid = false, className, ...props }: BoxIconProps) {
  let iconClass = name;

  if (name.startsWith("bxl-")) {
    iconClass = name;
  } else if (name.startsWith("bxs-")) {
    iconClass = name;
  } else if (name.startsWith("bx-")) {
    if (solid) {
      iconClass = name.replace(/^bx-/, "bxs-");
    }
  } else {
    iconClass = solid ? `bxs-${name}` : `bx-${name}`;
  }

  return <i className={cn("bx", iconClass, className)} aria-hidden="true" {...props} />;
}
