import { synchronize } from "@nozbe/watermelondb/sync";
import { getDatabase } from "./index";
import { supabase } from "@/lib/supabase/client";

export interface SyncResult {
  success: boolean;
  timestamp?: number;
  error?: string;
}

/**
 * Verifica se as credenciais do Supabase foram configuradas pelo desenvolvedor.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("placeholder-project"));
}

/**
 * Função central de sincronização bidirecional entre o WatermelonDB local e o Supabase.
 * Executa o protocolo oficial do WatermelonDB:
 * 1. Pull changes: busca alterações ocorridas no Supabase desde o último timestamp (`lastPulledAt`).
 * 2. Push changes: envia as alterações locais (criadas, atualizadas e deletadas) para o Supabase.
 */
export async function syncWithSupabase(): Promise<SyncResult> {
  if (typeof window === "undefined") {
    return { success: false, error: "Sync não pode rodar no ambiente do servidor." };
  }

  if (!navigator.onLine) {
    return { success: false, error: "Sem conexão com a internet. O Prumo continua funcionando offline." };
  }

  if (!isSupabaseConfigured()) {
    console.info(
      "[Prumo Sync] Supabase rodando em modo mock/placeholder. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env para persistência remota."
    );
    return { success: true, timestamp: Date.now() };
  }

  try {
    const db = getDatabase();

    await synchronize({
      database: db,
      pullChanges: async ({ lastPulledAt }) => {
        let query = supabase.from("tasks").select("*");

        if (lastPulledAt) {
          const lastPulledIso = new Date(lastPulledAt).toISOString();
          query = query.gt("updated_at", lastPulledIso);
        }

        const { data: serverRecords, error } = await query;

        if (error) {
          throw new Error(`Erro ao puxar dados do Supabase: ${error.message}`);
        }

        const created: Record<string, unknown>[] = [];
        const updated: Record<string, unknown>[] = [];
        const deleted: string[] = [];

        (serverRecords || []).forEach((record) => {
          const localRecord = {
            id: record.id,
            description: record.description,
            category: record.category,
            start_date: new Date(record.start_date).getTime(),
            end_date: record.end_date ? new Date(record.end_date).getTime() : null,
            recurrence_type: record.recurrence_type,
            recurrence_value: record.recurrence_value,
            status: record.status,
            order_index: Number(record.order_index ?? 0),
            created_at: new Date(record.created_at).getTime(),
            updated_at: new Date(record.updated_at).getTime(),
          };

          if (record.deleted_at) {
            deleted.push(record.id);
          } else if (!lastPulledAt || new Date(record.created_at).getTime() > lastPulledAt) {
            created.push(localRecord);
          } else {
            updated.push(localRecord);
          }
        });

        return {
          changes: {
            tasks: {
              created,
              updated,
              deleted,
            },
          },
          timestamp: Date.now(),
        };
      },

      pushChanges: async ({ changes }) => {
        const changesMap = changes as Record<string, { created: Record<string, unknown>[]; updated: Record<string, unknown>[]; deleted: string[] }>;
        const tasksChanges = changesMap["tasks"];
        if (!tasksChanges) return;

        const { created, updated, deleted } = tasksChanges;

        // Inserção de registros criados localmente
        if (created.length > 0) {
          const payloadToInsert = created.map((item: Record<string, unknown>) => ({
            id: item.id,
            description: item.description,
            category: item.category,
            start_date: new Date(Number(item.start_date)).toISOString(),
            end_date: item.end_date ? new Date(Number(item.end_date)).toISOString() : null,
            recurrence_type: item.recurrence_type,
            recurrence_value: item.recurrence_value,
            status: item.status,
            order_index: item.order_index,
            created_at: new Date(Number(item.created_at || Date.now())).toISOString(),
            updated_at: new Date(Number(item.updated_at || Date.now())).toISOString(),
          }));

          const { error } = await supabase.from("tasks").upsert(payloadToInsert);
          if (error) {
            throw new Error(`Erro ao enviar tarefas criadas ao Supabase: ${error.message}`);
          }
        }

        // Atualização de registros editados localmente
        if (updated.length > 0) {
          const payloadToUpdate = updated.map((item: Record<string, unknown>) => ({
            id: item.id,
            description: item.description,
            category: item.category,
            start_date: new Date(Number(item.start_date)).toISOString(),
            end_date: item.end_date ? new Date(Number(item.end_date)).toISOString() : null,
            recurrence_type: item.recurrence_type,
            recurrence_value: item.recurrence_value,
            status: item.status,
            order_index: item.order_index,
            updated_at: new Date(Number(item.updated_at || Date.now())).toISOString(),
          }));

          const { error } = await supabase.from("tasks").upsert(payloadToUpdate);
          if (error) {
            throw new Error(`Erro ao atualizar tarefas no Supabase: ${error.message}`);
          }
        }

        // Remoção de registros deletados localmente (Soft delete ou exclusão física no Supabase)
        if (deleted.length > 0) {
          const { error } = await supabase.from("tasks").delete().in("id", deleted);
          if (error) {
            throw new Error(`Erro ao deletar tarefas no Supabase: ${error.message}`);
          }
        }
      },
    });

    return { success: true, timestamp: Date.now() };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido na sincronização.";
    console.error("[Prumo Sync Error]:", message);
    return { success: false, error: message };
  }
}
