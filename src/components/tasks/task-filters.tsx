"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { BoxIcon } from "@/components/ui/box-icon";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export type DateFilterOption = "today" | "week" | "all";
export type StatusFilterOption = "today" | "all" | "completed" | "archived";

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDateFilter: DateFilterOption;
  onDateFilterChange: (dateFilter: DateFilterOption) => void;
  selectedStatusFilter: StatusFilterOption;
  onStatusFilterChange: (status: StatusFilterOption) => void;
  categories: string[];
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDateFilter,
  onDateFilterChange,
  selectedStatusFilter,
  onStatusFilterChange,
  categories,
}: TaskFiltersProps) {
  const [filtersOpen, setFiltersOpen] = React.useState<boolean>(false);

  // Verifica se há filtros customizados ativos além do padrão ("today")
  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedDateFilter !== "today" ? 1 : 0) +
    (selectedStatusFilter !== "today" ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0 || searchQuery.trim() !== "";

  const handleResetFilters = () => {
    onSearchChange("");
    onCategoryChange("all");
    onDateFilterChange("today");
    onStatusFilterChange("today");
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Linha Principal: Input de Busca com Botão Compacto de Filtros à Direita */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <BoxIcon
            name="search"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base"
          />
          <Input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9 bg-card h-10 rounded-xl text-base md:text-sm border shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              aria-label="Limpar busca"
            >
              <BoxIcon name="x" className="text-base" />
            </button>
          )}
        </div>

        {/* Ícone Pequeno de Filtro ao lado do Input */}
        <button
          type="button"
          onClick={() => setFiltersOpen((prev) => !prev)}
          className={`relative h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border transition-all cursor-pointer shadow-sm select-none ${
            filtersOpen || activeFiltersCount > 0
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground hover:text-foreground hover:bg-accent border-input"
          }`}
          title="Filtros de visualização"
          aria-label="Abrir filtros de tarefas"
        >
          <BoxIcon name="slider-alt" className="text-lg" />
          {activeFiltersCount > 0 && !filtersOpen && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Painel Retrátil de Filtros (aparece ao clicar no ícone) */}
      {filtersOpen && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl border bg-card shadow-md animate-in slide-in-from-top-2 fade-in duration-150">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <BoxIcon name="filter" className="text-sm text-primary" />
              Filtrar Tarefas
            </span>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  Limpar
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Fechar filtros"
              >
                <BoxIcon name="x" className="text-base" />
              </button>
            </div>
          </div>

          {/* Abas Rápidas de Status */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Exibição:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  onStatusFilterChange("today");
                  onDateFilterChange("today");
                }}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-center cursor-pointer ${
                  selectedStatusFilter === "today"
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                Tarefas de Hoje
              </button>
              <button
                type="button"
                onClick={() => {
                  onStatusFilterChange("all");
                  onDateFilterChange("all");
                }}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-center cursor-pointer ${
                  selectedStatusFilter === "all" && selectedDateFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => onStatusFilterChange("completed")}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-center cursor-pointer ${
                  selectedStatusFilter === "completed"
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                Concluídas
              </button>
              <button
                type="button"
                onClick={() => onStatusFilterChange("archived")}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-center cursor-pointer ${
                  selectedStatusFilter === "archived"
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                Arquivadas
              </button>
            </div>
          </div>

          {/* Seletores: Categoria e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Categoria */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <BoxIcon name="category" className="text-xs" />
                Categoria:
              </label>
              <Select
                value={selectedCategory}
                onValueChange={(val) => onCategoryChange((val as string) || "all")}
              >
                <SelectTrigger className="h-9 rounded-lg text-xs font-medium bg-background">
                  <SelectValue placeholder="Todas as Categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data de Criação */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <BoxIcon name="calendar" className="text-xs" />
                Período:
              </label>
              <Select
                value={selectedDateFilter}
                onValueChange={(val) => onDateFilterChange((val as DateFilterOption) || "today")}
              >
                <SelectTrigger className="h-9 rounded-lg text-xs font-medium bg-background">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="all">Todas as datas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => setFiltersOpen(false)}
              className="h-8 rounded-lg px-4 text-xs font-semibold"
            >
              Concluir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
