"use client";

import * as React from "react";
import { BoxIcon } from "@/components/ui/box-icon";
import { Badge } from "@/components/ui/badge";
import { PrumoLogo } from "@/components/ui/prumo-logo";
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
  userName?: string;
  onLogout?: () => void;
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
  userName,
  onLogout,
}: HeaderProps) {
  const [streakExpanded, setStreakExpanded] = React.useState<boolean>(false);

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-3.5 flex flex-col gap-3">
        {/* Barra Superior: Logo Prumo, Botão de Ofensiva Minimizado e Sync */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo Prumo */}
          <div className="flex items-center gap-2.5">
            <PrumoLogo size={36} className="shadow-sm" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Prumo
            </h1>
          </div>

          {/* Ações da Direita: Botão de Ofensiva (Minimizado) e Badge de Sincronização */}
          <div className="flex items-center gap-2">
            {/* Botão de Ofensiva Minimizado */}
            <button
              type="button"
              onClick={() => setStreakExpanded((prev) => !prev)}
              title="Clique para ver o progresso e detalhes da ofensiva"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-sm select-none ${
                isTodayCompleted
                  ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/25"
                  : "bg-muted/80 text-foreground border-border hover:bg-muted"
              }`}>
              <span className="text-sm leading-none">🔥</span>
              <span>
                {streakCount} {streakCount === 1 ? "dia" : "dias"}
              </span>
              <BoxIcon
                name={streakExpanded ? "chevron-up" : "chevron-down"}
                className="text-xs text-muted-foreground ml-0.5"
              />
            </button>

            {/* Botão / Badge de Sincronização */}
            <button
              onClick={onSyncClick}
              disabled={syncStatus === "syncing" || !isOnline}
              title={
                !isOnline
                  ? "Modo Offline ativo (Salvo no seu dispositivo)"
                  : "Clique para sincronizar com a nuvem"
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border bg-card hover:bg-accent transition-colors disabled:opacity-60 cursor-pointer shadow-sm">
              {syncStatus === "syncing" ? (
                <>
                  <BoxIcon
                    name="loader-alt"
                    className="animate-spin text-primary text-sm"
                  />
                  <span className="hidden sm:inline">Sync...</span>
                </>
              ) : !isOnline ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                    Offline
                  </span>
                </>
              ) : syncStatus === "error" ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-destructive font-semibold text-[11px] hidden sm:inline">
                    Pendente
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <BoxIcon
                    name="cloud"
                    className="text-xs text-muted-foreground"
                  />
                </>
              )}
            </button>

            {/* Usuário / Botão de Logout */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer shadow-sm text-muted-foreground"
                title={
                  userName
                    ? `Conectado como ${userName}. Clique para sair.`
                    : "Sair da conta"
                }
                aria-label="Sair da conta">
                <BoxIcon name="log-out" className="text-xs" />
                <span className="hidden sm:inline font-semibold">
                  {userName ? userName.split(" ")[0] : "Sair"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Card de Ofensiva Expandido (abre apenas quando clicado) */}
        {streakExpanded && (
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-500/25 p-4 shadow-md animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Botão de Fechar no canto superior */}
            <button
              type="button"
              onClick={() => setStreakExpanded(false)}
              className="absolute top-2.5 right-2.5 p-1 rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Minimizar ofensiva">
              <BoxIcon name="x" className="text-lg" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pr-6 sm:pr-0">
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl shadow-sm shrink-0 transition-transform ${
                    isTodayCompleted
                      ? "bg-linear-to-br from-amber-400 to-orange-500 text-white scale-105 shadow-orange-500/30 shadow-md"
                      : "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                  }`}>
                  🔥
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                      {streakCount} {streakCount === 1 ? "dia" : "dias"}
                    </span>
                    <Badge
                      variant={isTodayCompleted ? "success" : "warning"}
                      className="font-bold text-[10px]">
                      {isTodayCompleted ? "Ofensiva Concluída" : "Em Andamento"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isTodayCompleted
                      ? "Meta de hoje batida! Você manteve sua consistência diária."
                      : "Conclua todas as tarefas de hoje para avançar a sequência."}
                  </p>
                </div>
              </div>

              {/* Barra de Progresso de Hoje */}
              <div className="flex flex-col sm:items-end gap-1.5 min-w-40">
                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-semibold">
                  <span className="text-muted-foreground">Hoje:</span>
                  <span className="text-primary font-bold">
                    {completedCount}/{totalCount} ({completionPercentage}%)
                  </span>
                </div>
                <div className="w-full sm:w-44 h-2.5 bg-muted rounded-full overflow-hidden border border-border/50">
                  <div
                    className="h-full bg-linear-to-r from-orange-500 to-amber-500 transition-all duration-500 rounded-full"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
