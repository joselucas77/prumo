"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { BoxIcon } from "@/components/ui/box-icon";
import { Button } from "@/components/ui/button";

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
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedDateFilter !== "today" ||
    selectedStatusFilter !== "today";

  const handleResetFilters = () => {
    onSearchChange("");
    onCategoryChange("all");
    onDateFilterChange("today");
    onStatusFilterChange("today");
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-card p-4 rounded-2xl border shadow-sm">
      {/* Campo de Busca por Texto */}
      <div className="relative w-full">
        <BoxIcon
          name="search"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg"
        />
        <Input
          type="text"
          placeholder="Buscar tarefas por descrição..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-9 bg-background/50 h-11 rounded-xl text-base md:text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          >
            <BoxIcon name="x" className="text-base" />
          </button>
        )}
      </div>

      {/* Linha de Abas Rápidas de Visualização */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => {
            onStatusFilterChange("today");
            onDateFilterChange("today");
          }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
            selectedStatusFilter === "today"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
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
          className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
            selectedStatusFilter === "all" && selectedDateFilter === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Todas as Tarefas
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange("completed")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
            selectedStatusFilter === "completed"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Concluídas
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange("archived")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
            selectedStatusFilter === "archived"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Arquivadas
        </button>
      </div>

      {/* Filtros em Dropdowns/Seletores: Categoria e Data de Criação */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por Categoria */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <BoxIcon name="category" className="text-sm" />
              Categoria:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="bg-background border rounded-lg px-2.5 py-1.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring text-xs cursor-pointer"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Data de Criação */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <BoxIcon name="calendar" className="text-sm" />
              Data:
            </span>
            <select
              value={selectedDateFilter}
              onChange={(e) => onDateFilterChange(e.target.value as DateFilterOption)}
              className="bg-background border rounded-lg px-2.5 py-1.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring text-xs cursor-pointer"
            >
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="all">Todas as datas</option>
            </select>
          </div>
        </div>

        {/* Botão de Limpar Filtros */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            <BoxIcon name="reset" className="mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
