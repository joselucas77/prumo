"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Task } from "@/lib/db";
import { TaskCard } from "./task-card";
import { BoxIcon } from "@/components/ui/box-icon";
import { Button } from "@/components/ui/button";

interface TaskListProps {
  tasks: Task[];
  onToggleStatus: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onReorder: (taskIds: string[]) => void;
  onOpenNewTask: () => void;
  isTodayView?: boolean;
}

interface TouchDragState {
  x: number;
  y: number;
  width: number;
  offsetX: number;
  offsetY: number;
}

export function TaskList({
  tasks,
  onToggleStatus,
  onEdit,
  onArchive,
  onDelete,
  onReorder,
  onOpenNewTask,
  isTodayView = true,
}: TaskListProps) {
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = React.useState<string | null>(null);
  const [touchState, setTouchState] = React.useState<TouchDragState | null>(null);

  // Referência para toque no mobile
  const touchSourceIdRef = React.useRef<string | null>(null);
  const touchOverIdRef = React.useRef<string | null>(null);

  const executeReorder = React.useCallback(
    (sourceId: string, targetId: string) => {
      const currentIds = tasks.map((t) => t.id);
      const sourceIndex = currentIds.indexOf(sourceId);
      const targetIndex = currentIds.indexOf(targetId);

      if (sourceIndex === -1 || targetIndex === -1) return;

      const updatedIds = [...currentIds];
      const [removed] = updatedIds.splice(sourceIndex, 1);
      updatedIds.splice(targetIndex, 0, removed);

      onReorder(updatedIds);
    },
    [tasks, onReorder]
  );

  // Handlers para Desktop (Mouse HTML5)
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragOverTaskId !== id) {
      setDragOverTaskId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setTouchState(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData("text/plain") || draggedTaskId;

    if (!sourceId || sourceId === targetId) {
      handleDragEnd();
      return;
    }

    executeReorder(sourceId, targetId);
    handleDragEnd();
  };

  // Reordenação por toque no Mobile (Touch Events com Card Flutuante em tempo real)
  const handleTouchStartHandle = (e: React.TouchEvent<HTMLDivElement>, taskId: string) => {
    const touch = e.touches[0];
    const cardElement = (e.currentTarget as HTMLElement).closest("[data-task-id]") as HTMLElement | null;
    const rect = cardElement ? cardElement.getBoundingClientRect() : null;

    touchSourceIdRef.current = taskId;
    setDraggedTaskId(taskId);

    if (rect) {
      setTouchState({
        x: touch.clientX,
        y: touch.clientY,
        width: rect.width,
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top,
      });
    } else {
      setTouchState({
        x: touch.clientX,
        y: touch.clientY,
        width: 320,
        offsetX: 24,
        offsetY: 24,
      });
    }
  };

  React.useEffect(() => {
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!touchSourceIdRef.current) return;
      const touch = e.touches[0];

      // Atualiza coordenadas do card flutuante em tempo real
      setTouchState((prev) => (prev ? { ...prev, x: touch.clientX, y: touch.clientY } : null));

      const targetElem = document.elementFromPoint(touch.clientX, touch.clientY);
      const card = targetElem?.closest("[data-task-id]");
      const targetId = card?.getAttribute("data-task-id");

      if (targetId && targetId !== touchSourceIdRef.current) {
        touchOverIdRef.current = targetId;
        setDragOverTaskId(targetId);
      }
    };

    const handleGlobalTouchEnd = () => {
      const sourceId = touchSourceIdRef.current;
      const targetId = touchOverIdRef.current;

      if (sourceId && targetId && sourceId !== targetId) {
        executeReorder(sourceId, targetId);
      }

      touchSourceIdRef.current = null;
      touchOverIdRef.current = null;
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      setTouchState(null);
    };

    window.addEventListener("touchmove", handleGlobalTouchMove, { passive: true });
    window.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [executeReorder]);

  const handleMoveIndex = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= tasks.length || toIndex >= tasks.length) return;
    const currentIds = tasks.map((t) => t.id);
    const updatedIds = [...currentIds];
    const [removed] = updatedIds.splice(fromIndex, 1);
    updatedIds.splice(toIndex, 0, removed);
    onReorder(updatedIds);
  };

  const draggedTask = React.useMemo(() => {
    if (!draggedTaskId) return null;
    return tasks.find((t) => t.id === draggedTaskId) || null;
  }, [draggedTaskId, tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border-2 border-dashed border-border/80 bg-card/50">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground text-3xl mb-4">
          <BoxIcon name={isTodayView ? "calendar-check" : "list-check"} />
        </div>
        <h3 className="text-lg font-bold text-foreground">
          {isTodayView ? "Nenhuma tarefa para hoje" : "Nenhuma tarefa encontrada"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-5">
          {isTodayView
            ? "Você está com o dia livre ou pode adicionar novas metas para manter sua ofensiva!"
            : "Tente alterar os termos da busca ou os filtros aplicados."}
        </p>
        <Button onClick={onOpenNewTask} className="rounded-xl font-semibold shadow-sm">
          <BoxIcon name="plus" className="mr-1 text-lg" />
          Adicionar Nova Tarefa
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 w-full relative">
      {tasks.map((task, index) => (
        <TaskCard
          key={task.id}
          task={task}
          index={index}
          totalTasks={tasks.length}
          onToggleStatus={onToggleStatus}
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
          onMoveUp={() => handleMoveIndex(index, index - 1)}
          onMoveDown={() => handleMoveIndex(index, index + 1)}
          isDragging={draggedTaskId === task.id}
          isDragOver={dragOverTaskId === task.id}
          onDragStart={(e) => handleDragStart(e, task.id)}
          onDragOver={(e) => handleDragOver(e, task.id)}
          onDragEnd={handleDragEnd}
          onDrop={(e) => handleDrop(e, task.id)}
          onTouchStartHandle={(e) => handleTouchStartHandle(e, task.id)}
        />
      ))}

      {/* Card Flutuante Virtual que acompanha o dedo no Mobile (Touch Drag Floating Overlay) */}
      {typeof document !== "undefined" && touchState && draggedTask &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 rounded-2xl border-2 border-primary bg-card/95 p-3.5 sm:p-4 text-card-foreground shadow-2xl backdrop-blur-md transition-none select-none will-change-transform"
            style={{
              left: Math.max(8, touchState.x - touchState.offsetX),
              top: touchState.y - touchState.offsetY - 12,
              width: touchState.width,
              transform: "scale(1.04) rotate(1.5deg)",
              boxShadow:
                "0 25px 50px -10px rgba(0, 0, 0, 0.4), 0 0 20px 2px rgba(254, 112, 12, 0.35)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center justify-center shrink-0 pt-0.5 text-primary">
                <BoxIcon name="grid-vertical" className="text-xl" />
              </div>

              <div className="pt-0.5 shrink-0">
                <div className="h-5 w-5 rounded-md border-2 border-primary flex items-center justify-center bg-primary/10">
                  {draggedTask.status === "completed" && (
                    <BoxIcon name="check" className="text-sm font-bold text-primary" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5 mb-1">
                  {draggedTask.category && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                      {draggedTask.category}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] text-orange-600 dark:text-orange-400 font-bold bg-orange-500/15 px-1.5 py-0.5 rounded-md">
                    ✨ Movendo...
                  </span>
                </div>
                <p className="text-base font-semibold text-foreground truncate">
                  {draggedTask.description}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
