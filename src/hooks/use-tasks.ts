"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getDatabase,
  purgeGhostTasks,
  toggleTaskStatus,
  deleteTask,
  archiveTask,
  reorderTasks,
  Task,
} from "@/lib/db";
import { Q } from "@nozbe/watermelondb";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function initAndSubscribe() {
      try {
        if (typeof window === "undefined") return;

        // Remove eventuais tarefas corrompidas ou vazias do banco local
        await purgeGhostTasks();

        const db = getDatabase();
        const collection = db.get<Task>("tasks");

        // Observa as tarefas ordenadas por order_index
        const observable = collection
          .query(Q.sortBy("order_index", Q.asc))
          .observe();

        subscription = observable.subscribe({
          next: (records) => {
            if (isMounted) {
              setTasks([...records]);
              setIsLoading(false);
            }
          },
          error: (err) => {
            console.error("WatermelonDB observable error:", err);
            if (isMounted) {
              setError(err.message);
              setIsLoading(false);
            }
          },
        });
      } catch (err: unknown) {
        console.error("Failed to initialize tasks subscription:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Erro ao carregar tarefas locais");
          setIsLoading(false);
        }
      }
    }

    initAndSubscribe();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleToggle = useCallback(async (taskId: string) => {
    try {
      await toggleTaskStatus(taskId);
    } catch (err) {
      console.error("Erro ao alternar status da tarefa:", err);
    }
  }, []);

  const handleDelete = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error("Erro ao deletar tarefa:", err);
    }
  }, []);

  const handleArchive = useCallback(async (taskId: string) => {
    try {
      await archiveTask(taskId);
    } catch (err) {
      console.error("Erro ao arquivar tarefa:", err);
    }
  }, []);

  const handleReorder = useCallback(async (reorderedTaskIds: string[]) => {
    // 1. Atualização otimista imediata no estado local
    setTasks((prev) => {
      const taskMap = new Map(prev.map((t) => [t.id, t]));
      const nextList: Task[] = [];
      for (const id of reorderedTaskIds) {
        const item = taskMap.get(id);
        if (item) nextList.push(item);
      }
      for (const item of prev) {
        if (!reorderedTaskIds.includes(item.id)) {
          nextList.push(item);
        }
      }
      return nextList;
    });

    // 2. Persistência real no WatermelonDB
    try {
      await reorderTasks(reorderedTaskIds);
    } catch (err) {
      console.error("Erro ao reordenar tarefas no banco:", err);
    }
  }, []);

  return {
    tasks,
    isLoading,
    error,
    toggleTask: handleToggle,
    deleteTask: handleDelete,
    archiveTask: handleArchive,
    reorderTasks: handleReorder,
  };
}
