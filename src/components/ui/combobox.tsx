"use client";

import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { BoxIcon } from "@/components/ui/box-icon";
import { cn, normalizeSearchText } from "@/lib/utils";

export interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
  options: (string | ComboboxOption)[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowCreate?: boolean;
  createLabel?: (query: string) => string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Combobox({
  value = "",
  onChange,
  options = [],
  placeholder = "Selecione ou crie uma categoria...",
  searchPlaceholder = "Buscar ou criar categoria...",
  emptyText = "Nenhuma categoria encontrada.",
  allowCreate = true,
  disabled = false,
  className,
  id,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Normaliza lista de opções para { label, value }
  const normalizedOptions: ComboboxOption[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  // Filtra opções com base na busca (sem distinção de acento ou maiúsculas)
  const filteredOptions = React.useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(
      (opt) =>
        normalizeSearchText(opt.label).includes(q) ||
        normalizeSearchText(opt.value).includes(q),
    );
  }, [normalizedOptions, searchQuery]);

  // Verifica se o texto digitado já existe exatamente na lista
  const trimmedQuery = searchQuery.trim();
  const exactMatchExists = React.useMemo(() => {
    if (!trimmedQuery) return true;
    const norm = normalizeSearchText(trimmedQuery);
    return normalizedOptions.some(
      (opt) =>
        normalizeSearchText(opt.label) === norm || normalizeSearchText(opt.value) === norm,
    );
  }, [normalizedOptions, trimmedQuery]);

  // Rótulo da seleção atual
  const selectedLabel = React.useMemo(() => {
    if (!value) return "";
    const match = normalizedOptions.find((opt) => opt.value === value);
    return match ? match.label : value;
  }, [normalizedOptions, value]);

  const handleSelect = (val: string) => {
    onChange?.(val);
    setSearchQuery("");
    setOpen(false);
  };

  const handleCreateNew = () => {
    if (!trimmedQuery) return;
    onChange?.(trimmedQuery);
    setSearchQuery("");
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm transition-colors text-left font-normal",
          !value && "text-muted-foreground",
          className,
        )}>
        <span className="flex items-center gap-2 truncate">
          <BoxIcon
            name="category"
            className="text-primary text-base shrink-0"
          />
          <span className="truncate">{selectedLabel || placeholder}</span>
        </span>

        <BoxIcon
          name="chevron-down"
          className="text-muted-foreground text-xs opacity-60 ml-2 shrink-0"
        />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        positionerClassName="w-[var(--anchor-width)] min-w-[240px]"
        className="w-(--anchor-width) min-w-60 p-2 shadow-xl rounded-xl">
        {/* Campo de Busca / Criação */}
        <div className="relative flex items-center border-b border-border pb-2 mb-1 px-1">
          <BoxIcon
            name="search"
            className="text-muted-foreground text-sm mr-2 shrink-0"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!exactMatchExists && trimmedQuery && allowCreate) {
                  handleCreateNew();
                } else if (filteredOptions.length > 0) {
                  handleSelect(filteredOptions[0].value);
                }
              }
            }}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none text-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-0.5 text-muted-foreground hover:text-foreground rounded"
              title="Limpar busca">
              <BoxIcon name="x" className="text-sm" />
            </button>
          )}
        </div>

        {/* Lista de Opções */}
        <div
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="max-h-[min(16rem,50dvh)] overflow-y-auto overscroll-contain touch-pan-y space-y-0.5 py-0.5">
          {/* Opção de Criar Nova Categoria */}
          {allowCreate && trimmedQuery && !exactMatchExists && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex items-center gap-2 w-full px-2.5 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors cursor-pointer border border-primary/20 text-left mb-1">
              <BoxIcon name="plus-circle" className="text-base shrink-0" />
              <span className="truncate">
                Criar categoria &quot;<strong>{trimmedQuery}</strong>&quot;
              </span>
            </button>
          )}

          {/* Opções Filtradas */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "flex items-center justify-between w-full px-2.5 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "text-foreground hover:bg-accent",
                  )}>
                  <span className="truncate">{opt.label}</span>
                  <BoxIcon
                    name="check"
                    className={cn(
                      "text-sm shrink-0 ml-2",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </button>
              );
            })
          ) : !trimmedQuery ? (
            <p className="p-3 text-xs text-muted-foreground text-center">
              {emptyText}
            </p>
          ) : exactMatchExists ? (
            <p className="p-3 text-xs text-muted-foreground text-center">
              {emptyText}
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
