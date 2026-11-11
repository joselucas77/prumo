"use client";

import * as React from "react";
import { BoxIcon } from "@/components/ui/box-icon";
import { Badge } from "@/components/ui/badge";
import { type SyncStatus } from "@/hooks/use-online-sync";

interface HeaderProps {
  streakCount: number;
  isTodayCompleted: boolean;
  completionPercentage: number;
  completedCount: number;
  totalCount: number;
  isOnline: boolean;
  syncStatus: SyncStatus;
  onSyncClick: () => void;
}

export function Header({
  streakCount,
  isTodayCompleted,
  completionPercentage,
  completedCount,
  totalCount,
  isOnline,
  syncStatus,
  onSyncClick,
}: HeaderProps) {
  return (
    <header className="w-full border-b bg-background/95 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-5 flex flex-col gap-4">
        {/* Barra Superior: Logo e Status de Conexão */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md tracking-tight">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  Prumo
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                  Offline-First
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Alinhamento e foco diário com persistência local
              </p>
            </div>
          </div>

          {/* Badge de Sincronização & Internet */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSyncClick}
              disabled={syncStatus === "syncing" || !isOnline}
              title={
                !isOnline
                  ? "Modo Offline ativo (Salvo no WatermelonDB)"
                  : "Clique para forçar sincronização com o Supabase"
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-card hover:bg-accent transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {syncStatus === "syncing" ? (
                <>
                  <BoxIcon name="loader-alt" className="animate-spin text-primary" />
                  <span className="hidden sm:inline">Sincronizando...</span>
                </>
              ) : !isOnline ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">Offline</span>
                </>
              ) : syncStatus === "error" ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-destructive font-semibold">Sync Pendente</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 hidden sm:inline">Sincronizado</span>
                  <BoxIcon name="cloud" className="text-sm text-muted-foreground" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card Destaque da Ofensiva */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-500/20 p-4 md:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform duration-300 ${
                  isTodayCompleted
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white scale-105 shadow-orange-500/30 shadow-lg"
                    : "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                }`}
              >
                🔥
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                    {streakCount} {streakCount === 1 ? "dia" : "dias"}
                  </span>
                  <Badge variant={isTodayCompleted ? "success" : "warning"} className="font-bold">
                    {isTodayCompleted ? "Ofensiva Ativa" : "Em Andamento"}
                  </Badge>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                  {isTodayCompleted
                    ? "Parabéns! 100% das tarefas de hoje foram concluídas."
                    : "Conclua todas as tarefas de hoje para manter a sequência!"}
                </p>
              </div>
            </div>

            {/* Progresso do Dia */}
            <div className="flex flex-col sm:items-end gap-1.5 min-w-[160px]">
              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-semibold">
                <span className="text-muted-foreground">Progresso de Hoje:</span>
                <span className="text-primary font-bold">
                  {completedCount}/{totalCount} ({completionPercentage}%)
                </span>
              </div>
              <div className="w-full sm:w-44 h-2.5 bg-muted rounded-full overflow-hidden border border-border/50">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
