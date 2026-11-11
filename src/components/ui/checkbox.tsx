import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: "default" | "lg";
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, size = "default", disabled, ...props }, ref) => {
    const sizeClasses = size === "lg" ? "h-6 w-6 rounded-md" : "h-4 w-4 rounded";
    const iconSizeClass = size === "lg" ? "text-base" : "text-xs";

    return (
      <label
        className={cn(
          "inline-flex items-center justify-center cursor-pointer select-none relative group",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "flex items-center justify-center border-2 transition-all duration-200",
            sizeClasses,
            checked
              ? "bg-primary border-primary text-primary-foreground shadow-sm"
              : "border-muted-foreground/40 bg-background hover:border-primary/70",
            className
          )}
        >
          {checked && (
            <i className={cn("bx bx-check font-bold leading-none animate-in zoom-in-50 duration-150", iconSizeClass)} />
          )}
        </div>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
