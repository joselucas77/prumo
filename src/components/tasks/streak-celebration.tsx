"use client";

import * as React from "react";
import { BoxIcon } from "@/components/ui/box-icon";
import { getWeekStreakDays, type WeekDayInfo } from "@/hooks/use-streak";
import { cn } from "@/lib/utils";

interface StreakCelebrationProps {
  streakCount: number;
  isTodayCompleted?: boolean;
}

/**
 * Foguinho de Ofensiva Estilizado com Gradiente e Chama Branca Central Radiante.
 */
function StreakFlame() {
  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Brilho atmosférico avermelhado/alaranjado ao redor */}
      <div className="absolute w-44 h-44 rounded-full bg-linear-to-t from-red-600/35 via-orange-500/25 to-amber-400/15 blur-2xl pointer-events-none" />

      {/* SVG com Fogo Duolingo */}
      <svg
        viewBox="0 0 160 190"
        className="w-32 h-38 sm:w-36 sm:h-44 relative z-10 drop-shadow-[0_12px_32px_rgba(254,56,69,0.55)] animate-flame-pulse"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Gradiente exterior do corpo de fogo */}
          <linearGradient id="streakOuterFlameGrad" x1="80" y1="180" x2="80" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d81b2a" />
            <stop offset="30%" stopColor="#fe3845" />
            <stop offset="70%" stopColor="#ff7000" />
            <stop offset="100%" stopColor="#ffa600" />
          </linearGradient>

          {/* Gradiente da chama branca com brilho interno */}
          <radialGradient id="streakInnerCoreGrad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="75%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffeedd" />
          </radialGradient>
        </defs>

        {/* Fogo externo principal com silhueta orgânica curva */}
        <path
          d="M80 14C86 38 108 52 118 68C132 88 140 108 136 132C131 158 108 174 80 174C52 174 29 158 24 132C20 108 28 88 42 68C52 52 74 38 80 14Z"
          fill="url(#streakOuterFlameGrad)"
        />

        {/* Labareda secundária esquerda em relevo */}
        <path
          d="M80 14C68 42 42 60 36 88C30 110 36 130 42 144C31 128 28 108 34 88C40 68 62 48 80 14Z"
          fill="#e12232"
          opacity="0.85"
        />

        {/* Centro de gota branca incandescente (White Core) */}
        <path
          d="M80 94C84 104 95 116 95 128C95 141 88 150 80 150C72 150 65 141 65 128C65 116 76 104 80 94Z"
          fill="url(#streakInnerCoreGrad)"
          filter="drop-shadow(0 0 10px rgba(255, 255, 255, 0.95))"
        />
      </svg>

      {/* Sombra escura oval na base do foguinho */}
      <div className="w-24 h-4 -mt-2 rounded-[100%] bg-black/60 blur-[3px]" />
    </div>
  );
}

export function StreakCelebration({
  streakCount,
  isTodayCompleted = true,
}: StreakCelebrationProps) {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [displayCount, setDisplayCount] = React.useState<number>(streakCount || 1);
  const [weekDays, setWeekDays] = React.useState<WeekDayInfo[]>([]);

  // Atualiza os dias da semana de Segunda a Domingo
  const refreshWeekDays = React.useCallback(() => {
    setWeekDays(getWeekStreakDays(true));
  }, []);

  React.useEffect(() => {
    const handleCelebration = (e: Event) => {
      const customEvent = e as CustomEvent<{ streakCount?: number; date?: string }>;
      if (customEvent.detail?.streakCount) {
        setDisplayCount(customEvent.detail.streakCount);
      } else {
        setDisplayCount(streakCount || 1);
      }
      refreshWeekDays();
      setIsOpen(true);
    };

    window.addEventListener("prumo:streak-celebration", handleCelebration);
    return () => {
      window.removeEventListener("prumo:streak-celebration", handleCelebration);
    };
  }, [streakCount, refreshWeekDays]);

  React.useEffect(() => {
    if (!isOpen) return;

    // Tecla Escape para acessibilidade
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="streak-days-count"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#131f24] text-white select-none animate-in fade-in duration-300 overflow-y-auto"
    >
      {/* Conteúdo Central inspirado no Duolingo */}
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto">
        {/* 1. Foguinho com chama branca incandescente e efeito glow */}
        <StreakFlame />

        {/* 2. Número gigante e rótulo de dias de ofensiva */}
        <div className="mt-4 sm:mt-5">
          <span
            id="streak-days-count"
            className="text-6xl sm:text-7xl font-black tracking-tight text-[#fe3845] drop-shadow-sm font-sans leading-none select-none"
          >
            {displayCount}
          </span>
          <p className="text-xl sm:text-2xl font-black text-[#fe3845] mt-1 tracking-tight select-none">
            {displayCount === 1 ? "dia de ofensiva" : "dias de ofensiva"}
          </p>
        </div>

        {/* 3. Linha dos Dias da Semana: Começando na Segunda (Seg) até Domingo (Dom) */}
        <div className="w-full mt-7 sm:mt-8 px-1">
          {/* Nomes dos dias */}
          <div className="grid grid-cols-7 gap-1 mb-2.5">
            {weekDays.map((d) => (
              <span
                key={d.key}
                className={cn(
                  "text-xs sm:text-sm tracking-tight text-center transition-colors select-none",
                  d.isToday ? "text-[#fe3845] font-black" : "text-[#71828c] font-bold"
                )}
              >
                {d.label}
              </span>
            ))}
          </div>

          {/* Marcadores de conclusão com cápsula conectada contínua para todos os 7 dias */}
          <div className="grid grid-cols-7 gap-0 items-center">
            {weekDays.map((day, idx) => {
              const isCompleted = day.isCompleted;
              const prevCompleted = idx > 0 && weekDays[idx - 1].isCompleted;
              const nextCompleted = idx < 6 && weekDays[idx + 1].isCompleted;

              return (
                <div key={day.key} className="relative flex items-center justify-center w-full h-11 sm:h-12">
                  {isCompleted ? (
                    <>
                      {/* Cápsula laranja-avermelhada que se conecta aos dias adjacentes */}
                      <div
                        className={cn(
                          "absolute inset-y-1 bg-linear-to-r from-[#fe3845] via-[#ff6800] to-[#ff9400] flex items-center justify-center shadow-md",
                          !prevCompleted && !nextCompleted && "left-0.5 right-0.5 rounded-full",
                          !prevCompleted && nextCompleted && "left-0.5 right-0 rounded-l-full",
                          prevCompleted && nextCompleted && "left-0 right-0 rounded-none",
                          prevCompleted && !nextCompleted && "left-0 right-0.5 rounded-r-full"
                        )}
                      />
                      {/* Ícone de checkmark preto destacado */}
                      <div className="relative z-10 flex items-center justify-center text-[#111c22]">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5 sm:w-6 sm:h-6 fill-none stroke-current stroke-[3.5] stroke-linecap-round stroke-linejoin-round"
                          style={{ color: "#111c22" }}
                          aria-hidden="true"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    /* Círculo escuro para dias pendentes (uniforme de segunda a domingo) */
                    <div className="relative z-10 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-[#202f36] border border-white/5 flex items-center justify-center shadow-inner" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Mensagem comemorativa */}
        <div className="mt-7 sm:mt-8 px-2 max-w-xs">
          <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
            {displayCount > 1 ? (
              <>
                Você conseguiu uma <span className="text-[#fe3845] font-black">ofensiva perfeita</span> por praticar{" "}
                {displayCount} dias seguidos!
              </>
            ) : (
              <>
                Você conseguiu uma <span className="text-[#fe3845] font-black">ofensiva perfeita</span> ao concluir{" "}
                todas as tarefas de hoje!
              </>
            )}
          </p>
        </div>

        {/* 5. Botão de Fechar Exclusivo (conforme solicitado pelo usuário) */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="mt-8 w-full max-w-xs py-3.5 px-6 rounded-2xl bg-linear-to-r from-[#fe3845] via-[#ff5a00] to-[#ff8c00] hover:from-[#e02d3a] hover:to-[#e07b00] active:scale-[0.98] text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <BoxIcon name="check" className="text-xl" />
          <span>Fechar</span>
        </button>
      </div>
    </div>
  );
}
