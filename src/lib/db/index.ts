import { Database } from "@nozbe/watermelondb";
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import { schema } from "./schema";
import { Task, type TaskStatus, type RecurrenceType } from "./models/Task";

let databaseInstance: Database | null = null;

export function getDatabase(): Database {
  if (typeof window === "undefined") {
    throw new Error("WatermelonDB can only be instantiated in the browser runtime.");
  }

  if (!databaseInstance) {
    const adapter = new LokiJSAdapter({
      schema,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
      dbName: "prumo_db",
      onSetUpError: (error) => {
        console.error("WatermelonDB setup error:", error);
      },
      onQuotaExceededError: (error) => {
        console.error("WatermelonDB storage quota exceeded:", error);
      },
    });

    databaseInstance = new Database({
      adapter,
      modelClasses: [Task],
    });
  }

  return databaseInstance;
}

export function getTasksCollection() {
  const db = getDatabase();
  return db.get<Task>("tasks");
}

export interface CreateTaskInput {
  description: string;
  category: string;
  startDate: Date;
  endDate?: Date | null;
  recurrenceType: RecurrenceType;
  recurrenceValue: string;
  status?: TaskStatus;
  orderIndex?: number;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  if (!input.description || !input.description.trim()) {
    throw new Error("A descrição da tarefa é obrigatória.");
  }

  const db = getDatabase();
  const collection = db.get<Task>("tasks");

  let computedOrderIndex = input.orderIndex;
  if (computedOrderIndex === undefined) {
    const allTasks = await collection.query().fetch();
    const maxOrder = allTasks.reduce((max, t) => Math.max(max, t.orderIndex || 0), 0);
    computedOrderIndex = maxOrder + 1;
  }

  return await db.write(async () => {
    return await collection.create((task) => {
      task.description = input.description.trim();
      task.category = input.category ? input.category.trim() : "Geral";
      task.startDate = input.startDate || new Date();
      task.endDate = input.endDate ?? null;
      task.recurrenceType = input.recurrenceType || "daily";
      task.recurrenceValue = input.recurrenceValue || "1";
      task.status = input.status ?? "in_progress";
      task.orderIndex = computedOrderIndex!;
    });
  });
}

export async function updateTask(
  taskId: string,
  input: Partial<CreateTaskInput>
): Promise<Task> {
  const db = getDatabase();
  const collection = db.get<Task>("tasks");
  const task = await collection.find(taskId);

  return await db.write(async () => {
    return await task.update((record) => {
      if (input.description !== undefined) record.description = input.description.trim();
      if (input.category !== undefined) record.category = input.category.trim();
      if (input.startDate !== undefined) record.startDate = input.startDate;
      if (input.endDate !== undefined) record.endDate = input.endDate;
      if (input.recurrenceType !== undefined) record.recurrenceType = input.recurrenceType;
      if (input.recurrenceValue !== undefined) record.recurrenceValue = input.recurrenceValue;
      if (input.status !== undefined) record.status = input.status;
      if (input.orderIndex !== undefined) record.orderIndex = input.orderIndex;
    });
  });
}

export async function toggleTaskStatus(taskId: string): Promise<Task> {
  const db = getDatabase();
  const collection = db.get<Task>("tasks");
  const task = await collection.find(taskId);

  return await db.write(async () => {
    return await task.update((record) => {
      record.status = record.status === "completed" ? "in_progress" : "completed";
    });
  });
}

export async function archiveTask(taskId: string): Promise<Task> {
  const db = getDatabase();
  const collection = db.get<Task>("tasks");
  const task = await collection.find(taskId);

  return await db.write(async () => {
    return await task.update((record) => {
      record.status = "archived";
    });
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  const db = getDatabase();
  const collection = db.get<Task>("tasks");
  const task = await collection.find(taskId);

  await db.write(async () => {
    await task.markAsDeleted();
  });
}

export async function reorderTasks(taskIds: string[]): Promise<void> {
  const db = getDatabase();
  const collection = db.get<Task>("tasks");

  await db.write(async () => {
    for (let i = 0; i < taskIds.length; i++) {
      try {
        const task = await collection.find(taskIds[i]);
        if (task && task.orderIndex !== i) {
          await task.update((record) => {
            record.orderIndex = i;
          });
        }
      } catch (err) {
        console.warn(`Could not update order for task ${taskIds[i]}:`, err);
      }
    }
  });
}

/**
 * Remove quaisquer registros de tarefas vazias ou corrompidas do banco local
 */
export async function purgeGhostTasks(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const db = getDatabase();
    const collection = db.get<Task>("tasks");
    const allTasks = await collection.query().fetch();

    const cleanedKey = "prumo_db_cleaned_v2";
    const hasCleanedBefore = localStorage.getItem(cleanedKey);

    if (!hasCleanedBefore) {
      // O usuário solicitou explicitamente: "deixe tudo vazio para que eu possa criar as minhas tarefas"
      if (allTasks.length > 0) {
        await db.write(async () => {
          for (const t of allTasks) {
            await t.destroyPermanently();
          }
        });
      }
      localStorage.setItem(cleanedKey, "true");
      return;
    }

    // Limpeza contínua defensiva: remove tarefas vazias ou corrompidas
    const ghostTasks = allTasks.filter(
      (t) => !t.description || t.description.trim() === ""
    );

    if (ghostTasks.length > 0) {
      await db.write(async () => {
        for (const t of ghostTasks) {
          await t.destroyPermanently();
        }
      });
    }
  } catch (err) {
    console.warn("Could not purge ghost tasks:", err);
  }
}

export * from "./schema";
export * from "./models/Task";
