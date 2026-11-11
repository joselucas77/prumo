"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { syncWithSupabase } from "@/lib/db/sync";
import { toast } from "sonner";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getServerOnlineSnapshot(): boolean {
  return true;
}

export function useOnlineSync() {
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerOnlineSnapshot);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  const runSync = useCallback(async (notifyOnSuccess = false) => {
    if (typeof window === "undefined" || !navigator.onLine) {
      setSyncStatus("offline");
      return;
    }

    if (isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      setSyncStatus("syncing");

      const result = await syncWithSupabase();

      if (result.success) {
        setLastSyncedAt(new Date());
        setSyncStatus("idle");
        if (notifyOnSuccess) {
          toast.success("Sincronizado com Supabase com sucesso!");
        }
      } else {
        setSyncStatus("error");
        if (result.error && !result.error.includes("offline")) {
          toast.error("Falha ao sincronizar", { description: result.error });
        }
      }
    } catch (err: unknown) {
      setSyncStatus("error");
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Erro na sincronização", { description: message });
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      toast.info("Conexão restabelecida", {
        description: "Sincronizando tarefas com o Supabase...",
      });
      runSync(true);
    };

    const handleOffline = () => {
      setSyncStatus("offline");
      toast.warning("Você está offline", {
        description: "Tarefas continuarão sendo salvas localmente no WatermelonDB.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Sync inicial suave após montagem
    const timer = setTimeout(() => {
      if (navigator.onLine) {
        runSync(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [runSync]);

  return {
    isOnline,
    syncStatus: !isOnline ? "offline" : syncStatus,
    lastSyncedAt,
    syncNow: () => runSync(true),
  };
}
