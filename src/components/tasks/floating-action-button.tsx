"use client";

import * as React from "react";
import { BoxIcon } from "@/components/ui/box-icon";

interface FloatingActionButtonProps {
  onClick: () => void;
  ariaLabel?: string;
}

export function FloatingActionButton({
  onClick,
  ariaLabel = "Adicionar nova tarefa",
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/30 group"
    >
      <BoxIcon
        name="plus"
        className="text-2xl transition-transform group-hover:rotate-90 duration-200"
      />
      <span className="sr-only">{ariaLabel}</span>
    </button>
  );
}
