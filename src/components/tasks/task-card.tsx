"use client";

import * as React from "react";
import { Task } from "@/lib/db";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BoxIcon } from "@/components/ui/box-icon";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  index: number;
  totalTasks: number;
  onToggleStatus: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onTouchStartHandle?: (e: React.TouchEvent<HTMLDivElement>) => void;
}

export function TaskCard({
  task,
  index,
  totalTasks,
  onToggleStatus,
  onEdit,
  onArchive,
  onDelete,
  onMoveUp,
  onMoveDown,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onTouchStartHandle,
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
      data-task-id={task.id}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver?.(e);
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(e);
      }}
      className={cn(
        "group relative flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-200 select-none",
        isDragging && "opacity-30 scale-[0.98] ring-2 ring-primary border-primary shadow-xl",
        isDragOver && "border-t-4 border-t-primary bg-primary/5",
        isCompleted && "bg-muted/40 border-muted-foreground/20 opacity-80",
        "hover:shadow-md hover:border-primary/40"
      )}
    >
      {/* Alça de Arraste (Drag Handle) com suporte a Touch no mobile e Mouse no desktop */}
      <div className="flex flex-col items-center justify-center shrink-0 pt-0.5">
        <div
          onTouchStart={onTouchStartHandle}
          className="p-1 -ml-1 text-muted-foreground/40 group-hover:text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing touch-none select-none"
          title="Arraste para mover de posição"
        >
          <BoxIcon name="grid-vertical" className="text-xl" />
        </div>

        {/* Botões rápidos de subir/descer (facilitam reorganização imediata em 1 toque) */}
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
          {index > 0 && onMoveUp && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="text-muted-foreground hover:text-foreground p-0.5"
              title="Mover para cima"
              aria-label="Mover para cima"
            >
              <BoxIcon name="chevron-up" className="text-xs" />
            </button>
          )}
          {index < totalTasks - 1 && onMoveDown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="text-muted-foreground hover:text-foreground p-0.5"
              title="Mover para baixo"
              aria-label="Mover para baixo"
            >
              <BoxIcon name="chevron-down" className="text-xs" />
            </button>
          )}
        </div>
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
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {/* Badge de Categoria */}
          {task.category && (
            <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0">
              {task.category}
            </Badge>
          )}

          {/* Badge de Recorrência */}
          {recurrenceLabel && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md font-medium">
              <BoxIcon name="repeat" className="text-[11px]" />
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

        {/* Descrição / Título */}
        <p
          className={cn(
            "text-base md:text-sm font-medium leading-snug break-words transition-all duration-150",
            isCompleted
              ? "line-through text-muted-foreground font-normal"
              : "text-foreground"
          )}
        >
          {task.description}
        </p>
      </div>

      {/* Ações Pequenas: Editar, Arquivar, Deletar */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
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

        <AlertDialog>
          <AlertDialogTrigger
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Deletar tarefa"
            aria-label="Deletar tarefa"
          >
            <BoxIcon name="trash" className="text-base" />
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir &quot;{task.description}&quot;? Esta ação removerá a tarefa localmente e sincronizará a exclusão com a nuvem.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(task.id)}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
