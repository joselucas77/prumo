"use client";

import * as React from "react";
import { BoxIcon } from "@/components/ui/box-icon";
import { cn } from "@/lib/utils";

function subscribe(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  return window.scrollY > 200;
}

function getServerSnapshot() {
  return false;
}

interface ScrollToTopProps {
  className?: string;
  threshold?: number;
}

export function ScrollToTop({ className }: ScrollToTopProps) {
  const isVisible = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      className={cn(
        "fixed bottom-24 right-6 md:bottom-26 md:right-8 z-30",
        "h-11 w-11 rounded-full border bg-card/90 backdrop-blur-md text-muted-foreground shadow-lg hover:text-foreground hover:border-primary/50 hover:bg-card hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center select-none animate-in fade-in zoom-in-75",
        className
      )}
      title="Voltar ao topo"
      aria-label="Voltar ao topo da página"
    >
      <BoxIcon name="chevron-up" className="text-xl" />
    </button>
  );
}
