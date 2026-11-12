import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PrumoLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | number;
  priority?: boolean;
}

export function PrumoLogo({
  size = "sm",
  priority = true,
  className,
  ...props
}: PrumoLogoProps) {
  let dimension = 36;
  let roundedClass = "rounded-xl";

  if (typeof size === "number") {
    dimension = size;
    roundedClass = size >= 48 ? "rounded-2xl" : "rounded-xl";
  } else {
    switch (size) {
      case "sm":
        dimension = 36;
        roundedClass = "rounded-xl";
        break;
      case "md":
        dimension = 48;
        roundedClass = "rounded-2xl";
        break;
      case "lg":
        dimension = 64;
        roundedClass = "rounded-2xl";
        break;
      case "xl":
        dimension = 80;
        roundedClass = "rounded-3xl";
        break;
    }
  }

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-white shadow-sm border border-border/40 select-none flex items-center justify-center transition-transform",
        roundedClass,
        className
      )}
      style={{ width: dimension, height: dimension }}
      {...props}
    >
      <Image
        src="/prumo-joao-de-barro.svg"
        alt="Logo Prumo (João-de-barro)"
        width={dimension}
        height={dimension}
        priority={priority}
        className="object-contain w-full h-full p-0.5"
      />
    </div>
  );
}
