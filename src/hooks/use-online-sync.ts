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

export function useOnlineSync(userId?: string) {
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerOnlineSnapshot);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  const runSync = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) {
      setSyncStatus("offline");
      return;
    }

    if (isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      setSyncStatus("syncing");

      const result = await syncWithSupabase(userId);

      if (result.success) {
        setLastSyncedAt(new Date());
        setSyncStatus("idle");
        // Não emite toast de sincronização - o status visual (ícone/pontinho verde) no header já indica o estado
      } else {
        setSyncStatus("error");
        console.warn("[Prumo Sync] Sincronização pendente:", result.error);
      }
    } catch (err: unknown) {
      setSyncStatus("error");
      const message = err instanceof Error ? err.message : "Erro na sincronização";
      console.warn("[Prumo Sync] Erro na sincronização:", message);
    } finally {
      isSyncingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      // Reconexão silenciosa com sincronização em background
      runSync();
    };

    const handleOffline = () => {
      setSyncStatus("offline");
      toast.warning("Você está offline", {
        description: "Suas tarefas continuam salvas no seu dispositivo.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Sync inicial suave após montagem
    const timer = setTimeout(() => {
      if (navigator.onLine) {
        runSync();
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
    syncNow: runSync,
  };
}
