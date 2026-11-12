"use client";

import * as React from "react";
import { BoxIcon } from "@/components/ui/box-icon";
import { Button } from "@/components/ui/button";

interface StreakCelebrationProps {
  streakCount: number;
}

export function StreakCelebration({ streakCount }: StreakCelebrationProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [displayCount, setDisplayCount] = React.useState<number>(streakCount || 1);

  React.useEffect(() => {
    const handleCelebration = (e: Event) => {
      const customEvent = e as CustomEvent<{ streakCount?: number; date?: string }>;
      if (customEvent.detail?.streakCount) {
        setDisplayCount(customEvent.detail.streakCount);
      } else {
        setDisplayCount(streakCount || 1);
      }
      setIsOpen(true);
    };

    window.addEventListener("prumo:streak-celebration", handleCelebration);
    window.addEventListener("prumo:day-completed", handleCelebration);
    return () => {
      window.removeEventListener("prumo:streak-celebration", handleCelebration);
      window.removeEventListener("prumo:day-completed", handleCelebration);
    };
  }, [streakCount]);

  React.useEffect(() => {
    if (!isOpen) return;

    // Auto-fechamento após 6 segundos caso o usuário não clique
    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 6000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="streak-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300"
      onClick={() => setIsOpen(false)}
    >
      {/* Card Central com Efeito Glow de Fogo */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl border border-orange-500/30 bg-card p-6 sm:p-7 shadow-2xl text-center flex flex-col items-center overflow-hidden transition-all duration-300"
        style={{
          boxShadow:
            "0 20px 50px -10px rgba(254, 112, 12, 0.3), 0 0 30px 2px rgba(254, 160, 50, 0.2)",
        }}
      >
        {/* Fundo sutil com gradiente radial de chama */}
        <div className="absolute inset-0 bg-radial from-orange-500/15 via-amber-500/5 to-transparent pointer-events-none" />

        {/* Efeito de anéis pulsantes ao redor do fogo */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute h-28 w-28 rounded-full bg-orange-500/20 animate-ping opacity-60 pointer-events-none" />
          <div className="absolute h-24 w-24 rounded-full bg-linear-to-tr from-orange-500/30 to-amber-400/30 blur-md pointer-events-none" />

          {/* Círculo do Foguinho Principal com animação */}
          <div className="relative h-20 w-20 rounded-2xl bg-linear-to-br from-amber-400 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/40 animate-flame-pulse border-2 border-amber-200/40">
            <span className="text-4xl leading-none select-none drop-shadow-md">
              🔥
            </span>
          </div>
        </div>

        {/* Textos Comemorativos */}
        <h2
          id="streak-title"
          className="text-2xl sm:text-3xl font-black tracking-tight text-foreground"
        >
          Ofensiva Batida!
        </h2>

        {/* Badge destacada com o número de dias */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 font-extrabold text-sm sm:text-base">
          <span>🔥</span>
          <span>
            {displayCount} {displayCount === 1 ? "dia consecutivo" : "dias consecutivos"}
          </span>
        </div>

        <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xs">
          Parabéns! Você fechou o ciclo anterior com 100% das tarefas concluídas e garantiu mais um dia na sua ofensiva de consistência.
        </p>

        {/* Barra 100% de Conclusão */}
        <div className="w-full mt-4 bg-muted rounded-full h-2 overflow-hidden border border-border/60">
          <div className="bg-linear-to-r from-amber-500 to-orange-500 h-full w-full rounded-full" />
        </div>

        {/* Botão de Conclusão */}
        <Button
          type="button"
          onClick={() => setIsOpen(false)}
          className="mt-5 w-full rounded-xl bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-orange-500/25 py-2.5 cursor-pointer"
        >
          <BoxIcon name="check" className="mr-1.5 text-lg" />
          Começar o Dia com Foco
        </Button>
      </div>
    </div>
  );
}
