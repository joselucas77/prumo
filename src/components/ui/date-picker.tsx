"use client";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { BoxIcon } from "@/components/ui/box-icon";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange?: (dateStr: string) => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEKDAY_NAMES = ["D", "S", "T", "Q", "Q", "S", "S"];

function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  return null;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DatePicker({
  value = "",
  onChange,
  placeholder = "Selecione uma data",
  clearable = true,
  disabled = false,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => parseLocalDate(value), [value]);

  // Visualização de mês/ano no calendário controlada pelo usuário ao navegar
  const [navDate, setNavDate] = React.useState<Date | null>(null);

  // Deriva o mês/ano a ser exibido: navegação do usuário > data selecionada > data atual
  const viewDate = navDate ?? selectedDate ?? new Date();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => {
    setNavDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(year, month, day);
    const formatted = formatLocalDate(newDate);
    onChange?.(formatted);
    setOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    onChange?.(formatLocalDate(today));
    setOpen(false);
  };

  const handleSelectTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    onChange?.(formatLocalDate(tomorrow));
    setOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange?.("");
  };

  // Cálculo dos dias do mês
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const formatDisplayDate = () => {
    if (!selectedDate) return null;
    const today = new Date();
    const isCurrentDate =
      today.getFullYear() === selectedDate.getFullYear() &&
      today.getMonth() === selectedDate.getMonth() &&
      today.getDate() === selectedDate.getDate();

    const formatted = selectedDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    if (isCurrentDate) {
      return `Hoje (${formatted})`;
    }

    return formatted;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm transition-colors text-left font-normal",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <BoxIcon name="calendar" className="text-primary text-base shrink-0" />
          <span className="truncate">{formatDisplayDate() || placeholder}</span>
        </span>

        <span className="flex items-center gap-1 shrink-0 ml-2">
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Limpar data"
              aria-label="Limpar data"
            >
              <BoxIcon name="x" className="text-sm" />
            </button>
          )}
          <BoxIcon name="chevron-down" className="text-muted-foreground text-xs opacity-60" />
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[280px] p-3 shadow-xl">
        {/* Cabeçalho do Calendário: Mês e Navegação */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-foreground">
            {MONTH_NAMES[month]} {year}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <BoxIcon name="chevron-left" className="text-base" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <BoxIcon name="chevron-right" className="text-base" />
            </button>
          </div>
        </div>

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {WEEKDAY_NAMES.map((w, idx) => (
            <span
              key={`${w}-${idx}`}
              className="text-[11px] font-semibold text-muted-foreground/80 py-0.5"
            >
              {w}
            </span>
          ))}
        </div>

        {/* Grade de Dias */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Dias do mês anterior */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
            const prevDayNum = daysInPrevMonth - firstDayOfWeek + idx + 1;
            return (
              <span
                key={`prev-${idx}`}
                className="h-8 flex items-center justify-center text-xs text-muted-foreground/30 select-none"
              >
                {prevDayNum}
              </span>
            );
          })}

          {/* Dias do mês atual */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const selected = isSelected(dayNum);
            const today = isToday(dayNum);

            return (
              <button
                key={`day-${dayNum}`}
                type="button"
                onClick={() => handleSelectDay(dayNum)}
                className={cn(
                  "h-8 w-full rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer",
                  selected
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : today
                    ? "border border-primary text-primary font-bold hover:bg-primary/10"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {/* Atalhos Rápidos */}
        <div className="flex items-center justify-between border-t border-border mt-3 pt-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-primary hover:underline font-semibold cursor-pointer"
            >
              Hoje
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              type="button"
              onClick={handleSelectTomorrow}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Amanhã
            </button>
          </div>

          {clearable && value && (
            <button
              type="button"
              onClick={() => {
                handleClear();
                setOpen(false);
              }}
              className="text-muted-foreground hover:text-destructive cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
