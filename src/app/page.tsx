"use client";

import * as React from "react";
import { Header } from "@/components/tasks/header";
import {
  TaskFilters,
  type DateFilterOption,
  type StatusFilterOption,
} from "@/components/tasks/task-filters";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { FloatingActionButton } from "@/components/tasks/floating-action-button";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { useTasks } from "@/hooks/use-tasks";
import { useOnlineSync } from "@/hooks/use-online-sync";
import { useStreak } from "@/hooks/use-streak";
import { createTask, updateTask, Task } from "@/lib/db";
import { BoxIcon } from "@/components/ui/box-icon";

export default function Home() {
  // 1. Reatividade e persistência local via WatermelonDB
  const {
    tasks,
    isLoading,
    error,
    toggleTask,
    deleteTask,
    archiveTask,
    reorderTasks,
  } = useTasks();

  // 2. Detecção de internet e sincronização com Supabase
  const { isOnline, syncStatus, syncNow } = useOnlineSync();

  // 3. Estados de Filtros e Busca
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedDateFilter, setSelectedDateFilter] = React.useState<DateFilterOption>("today");
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<StatusFilterOption>("today");

  // 4. Modal/Drawer de Formulário de Tarefa
  const [formOpen, setFormOpen] = React.useState<boolean>(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);

  // 5. Extração dinâmica de categorias disponíveis
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.category && t.category.trim()) {
        set.add(t.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  // 6. Tarefas do dia de hoje (base para cálculo da Regra de Negócio da Ofensiva)
  const todayTasks = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter((t) => {
      if (t.status === "archived") return false;

      // Tarefas diárias sempre contam para hoje
      if (t.recurrenceType === "daily") return true;

      // Tarefas com dias específicos da semana
      if (t.recurrenceType === "specific_days") {
        try {
          const daysArray = JSON.parse(t.recurrenceValue);
          const dayKeys = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
          const currentDayKey = dayKeys[new Date().getDay()];
          if (Array.isArray(daysArray) && daysArray.includes(currentDayKey)) {
            return true;
          }
        } catch {
          // fallback
        }
      }

      // Verificação de timestamp por data de início
      if (t.startDate) {
        const start = new Date(t.startDate);
        return start <= tomorrow;
      }

      return true;
    });
  }, [tasks]);

  // 7. Regra de Negócio da Ofensiva: Observa as tarefas de hoje e dispara evento ao atingir 100%
  const {
    streakCount,
    isTodayCompleted,
    completionPercentage,
    completedCount,
    totalCount,
  } = useStreak(todayTasks);

  // 8. Filtragem das tarefas exibidas na lista da tela
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      // Filtro de Busca por Texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = task.description?.toLowerCase().includes(query);
        const catMatch = task.category?.toLowerCase().includes(query);
        if (!descMatch && !catMatch) return false;
      }

      // Filtro de Categoria
      if (selectedCategory !== "all" && task.category !== selectedCategory) {
        return false;
      }

      // Filtro de Status
      if (selectedStatusFilter === "today") {
        // Tarefas ativas de hoje (não arquivadas)
        if (task.status === "archived") return false;
        const isPartOfToday = todayTasks.some((todayTask) => todayTask.id === task.id);
        if (!isPartOfToday) return false;
      } else if (selectedStatusFilter === "completed") {
        if (task.status !== "completed") return false;
      } else if (selectedStatusFilter === "archived") {
        if (task.status !== "archived") return false;
      } else {
        // "all" - exibe tudo menos arquivadas a menos que especificadas
        if (task.status === "archived") return false;
      }

      // Filtro de Data de Criação
      if (selectedDateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskCreated = new Date(task.createdAt || task.startDate);
        if (taskCreated < today && task.recurrenceType !== "daily") {
          // se não for diária e for anterior a hoje, oculta no filtro estrito de hoje
          if (selectedStatusFilter !== "today") return false;
        }
      } else if (selectedDateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const taskCreated = new Date(task.createdAt || task.startDate);
        if (taskCreated < weekAgo) return false;
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    selectedCategory,
    selectedStatusFilter,
    selectedDateFilter,
    todayTasks,
  ]);

  // 9. Handlers para Ações de Tarefas (Exclusivamente no WatermelonDB)
  const handleOpenNewTask = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: {
    description: string;
    category: string;
    startDate: Date;
    endDate?: Date | null;
    recurrenceType: "daily" | "interval" | "specific_days";
    recurrenceValue: string;
    status: "completed" | "in_progress" | "archived";
  }) => {
    if (editingTask) {
      // Atualização no WatermelonDB
      await updateTask(editingTask.id, {
        description: data.description,
        category: data.category,
        startDate: data.startDate,
        endDate: data.endDate,
        recurrenceType: data.recurrenceType,
        recurrenceValue: data.recurrenceValue,
        status: data.status,
      });
    } else {
      // Criação no WatermelonDB
      await createTask({
        description: data.description,
        category: data.category,
        startDate: data.startDate,
        endDate: data.endDate,
        recurrenceType: data.recurrenceType,
        recurrenceValue: data.recurrenceValue,
        status: data.status,
      });
    }

    // Se estiver online, executa o sync em segundo plano
    if (isOnline) {
      syncNow();
    }
  };

  const handleToggleStatus = async (taskId: string) => {
    await toggleTask(taskId);
    if (isOnline) {
      syncNow();
    }
  };

  const handleArchive = async (taskId: string) => {
    await archiveTask(taskId);
    if (isOnline) {
      syncNow();
    }
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
    if (isOnline) {
      syncNow();
    }
  };

  const handleReorder = async (reorderedIds: string[]) => {
    await reorderTasks(reorderedIds);
    if (isOnline) {
      syncNow();
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 pb-24 md:pb-10">
      {/* 1. Header com Branding Prumo e Contador de Ofensiva */}
      <Header
        streakCount={streakCount}
        isTodayCompleted={isTodayCompleted}
        completionPercentage={completionPercentage}
        completedCount={completedCount}
        totalCount={totalCount}
        isOnline={isOnline}
        syncStatus={syncStatus}
        onSyncClick={syncNow}
      />

      {/* Conteúdo Principal */}
      <main className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* 2. Área de Busca e Filtros */}
        <TaskFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedDateFilter={selectedDateFilter}
          onDateFilterChange={setSelectedDateFilter}
          selectedStatusFilter={selectedStatusFilter}
          onStatusFilterChange={setSelectedStatusFilter}
          categories={categories}
        />

        {/* 3. Lista de Tarefas com Drag and Drop */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <span>
                {selectedStatusFilter === "today"
                  ? "Tarefas de Hoje"
                  : selectedStatusFilter === "completed"
                  ? "Tarefas Concluídas"
                  : selectedStatusFilter === "archived"
                  ? "Tarefas Arquivadas"
                  : "Todas as Tarefas"}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {filteredTasks.length}
              </span>
            </h2>

            {filteredTasks.length > 1 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 hidden sm:flex">
                <BoxIcon name="move" className="text-sm" />
                Arraste os cards para reordenar
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
              <BoxIcon name="loader-alt" className="animate-spin text-3xl text-primary" />
              <p className="text-sm font-medium">Carregando dados do WatermelonDB...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
              <p className="font-semibold">Erro ao carregar banco local:</p>
              <p>{error}</p>
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEditTask}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onReorder={handleReorder}
              onOpenNewTask={handleOpenNewTask}
              isTodayView={selectedStatusFilter === "today"}
            />
          )}
        </section>
      </main>

      {/* Botão Flutuante de Rolagem Suave para o Topo */}
      <ScrollToTop />

      {/* 4. Botão Flutuante (FAB) no canto inferior direito */}
      <FloatingActionButton onClick={handleOpenNewTask} />

      {/* Modal/Drawer Polimórfico de Criação/Edição */}
      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        taskToEdit={editingTask}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
