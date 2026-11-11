"use client";

import * as React from "react";
import { Task } from "@/lib/db";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BoxIcon } from "@/components/ui/box-icon";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onToggleStatus: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function TaskCard({
  task,
  onToggleStatus,
  onEdit,
  onArchive,
  onDelete,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const isArchived = task.status === "archived";

  const formatRecurrence = (type: string, val: string) => {
    if (type === "daily") return "Diária";
    if (type === "interval") return `A cada ${val || "1"} dia(s)`;
    if (type === "specific_days") {
      try {
        const days = JSON.parse(val);
        if (Array.isArray(days)) return days.join(", ");
      } catch {
        // fallback
      }
      return val || "Dias específicos";
    }
    return null;
  };

  const recurrenceLabel = formatRecurrence(task.recurrenceType, task.recurrenceValue);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={cn(
        "group relative flex items-start gap-3.5 p-4 rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-200 select-none",
        isDragging && "opacity-40 scale-[0.98] ring-2 ring-primary border-primary shadow-lg",
        isDragOver && "border-t-4 border-t-primary bg-accent/40",
        isCompleted && "bg-muted/40 border-muted-foreground/20 opacity-85",
        "hover:shadow-md hover:border-primary/40 cursor-grab active:cursor-grabbing"
      )}
    >
      {/* Drag Handle */}
      <div
        className="mt-1 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0"
        title="Arraste para reordenar"
      >
        <BoxIcon name="grid-vertical" className="text-xl" />
      </div>

      {/* Checkbox Grande Touch-Friendly */}
      <div className="pt-0.5 shrink-0">
        <Checkbox
          size="lg"
          checked={isCompleted}
          disabled={isArchived}
          onCheckedChange={() => onToggleStatus(task.id)}
          aria-label={`Marcar "${task.description}" como ${isCompleted ? "pendente" : "concluída"}`}
        />
      </div>

      {/* Corpo da Tarefa */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {/* Badge de Categoria */}
          {task.category && (
            <Badge variant="secondary" className="text-[11px] font-semibold px-2 py-0.2">
              {task.category}
            </Badge>
          )}

          {/* Badge de Recorrência */}
          {recurrenceLabel && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-medium">
              <BoxIcon name="repeat" className="text-xs" />
              {recurrenceLabel}
            </span>
          )}

          {/* Badge de Arquivada se aplicável */}
          {isArchived && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Arquivada
            </Badge>
          )}
        </div>

        {/* Descrição / Título com efeito riscado quando concluída */}
        <p
          className={cn(
            "text-base md:text-sm font-medium leading-relaxed break-words transition-all duration-150",
            isCompleted
              ? "line-through text-muted-foreground font-normal"
              : "text-foreground"
          )}
        >
          {task.description}
        </p>
      </div>

      {/* Ações Pequenas: Editar, Arquivar, Deletar */}
      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Editar tarefa"
          aria-label="Editar tarefa"
        >
          <BoxIcon name="edit-alt" className="text-base" />
        </button>

        {!isArchived && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(task.id);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Arquivar tarefa"
            aria-label="Arquivar tarefa"
          >
            <BoxIcon name="archive-in" className="text-base" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Deseja realmente excluir esta tarefa?")) {
              onDelete(task.id);
            }
          }}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          title="Deletar tarefa"
          aria-label="Deletar tarefa"
        >
          <BoxIcon name="trash" className="text-base" />
        </button>
      </div>
    </div>
  );
}
