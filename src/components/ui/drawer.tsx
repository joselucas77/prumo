"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { BoxIcon } from "@/components/ui/box-icon";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  const [translateY, setTranslateY] = React.useState<number>(0);
  const [isSwiping, setIsSwiping] = React.useState<boolean>(false);
  const startYRef = React.useRef<number>(0);
  const currentYRef = React.useRef<number>(0);

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

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwiping) return;
    currentYRef.current = e.touches[0].clientY;
    const deltaY = currentYRef.current - startYRef.current;
    if (deltaY > 0) {
      setTranslateY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    const deltaY = currentYRef.current - startYRef.current;

    // Se puxou mais de 80px para baixo, fecha o drawer
    if (deltaY > 80) {
      onOpenChange(false);
    }
    setTranslateY(0);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop com fechamento ao tocar */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Drawer Shell retrátil com suporte a gesto swipe-down */}
      <div
        style={{
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          transition: isSwiping ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="relative z-50 flex flex-col w-full max-h-[92dvh] rounded-t-3xl border-t bg-background shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden"
      >
        {/* Barra superior com Handle para arrastar para baixo */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full pt-3.5 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="h-1.5 w-14 rounded-full bg-muted-foreground/40 hover:bg-muted-foreground/60 transition-colors" />
        </div>

        {children}
      </div>
    </div>
  );
}

export function DrawerHeader({
  className,
  children,
  onClose,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }) {
  return (
    <div
      className={cn(
        "relative flex flex-col space-y-1 px-4 py-2.5 border-b shrink-0 text-center",
        className
      )}
      {...props}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-2.5 p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <BoxIcon name="x" className="text-xl" />
        </button>
      )}
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
    <h2 className={cn("text-lg font-bold leading-none tracking-tight text-foreground", className)} {...props}>
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
