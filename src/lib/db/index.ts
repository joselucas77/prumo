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
      task.category = input.category.trim();
      task.startDate = input.startDate;
      task.endDate = input.endDate ?? null;
      task.recurrenceType = input.recurrenceType;
      task.recurrenceValue = input.recurrenceValue;
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
    const batchUpdates = [];
    for (let i = 0; i < taskIds.length; i++) {
      const task = await collection.find(taskIds[i]);
      if (task.orderIndex !== i) {
        batchUpdates.push(
          task.prepareUpdate((record) => {
            record.orderIndex = i;
          })
        );
      }
    }
    if (batchUpdates.length > 0) {
      await db.batch(...batchUpdates);
    }
  });
}

export async function seedInitialTasksIfEmpty(): Promise<void> {
  if (typeof window === "undefined") return;

  const db = getDatabase();
  const collection = db.get<Task>("tasks");
  const existing = await collection.query().fetchCount();

  if (existing > 0) return;

  const today = new Date();
  today.setHours(8, 0, 0, 0);

  const initialItems: CreateTaskInput[] = [
    {
      description: "Revisar planejamento semanal no Prumo",
      category: "Planejamento",
      startDate: today,
      recurrenceType: "daily",
      recurrenceValue: "1",
      status: "completed",
      orderIndex: 0,
    },
    {
      description: "Praticar 30 minutos de exercícios físicos",
      category: "Saúde",
      startDate: today,
      recurrenceType: "daily",
      recurrenceValue: "1",
      status: "in_progress",
      orderIndex: 1,
    },
    {
      description: "Estudar padrões de arquitetura Offline-First",
      category: "Estudos",
      startDate: today,
      recurrenceType: "specific_days",
      recurrenceValue: JSON.stringify(["seg", "qua", "sex"]),
      status: "in_progress",
      orderIndex: 2,
    },
    {
      description: "Alinhar entregas da sprint com a equipe",
      category: "Trabalho",
      startDate: today,
      recurrenceType: "daily",
      recurrenceValue: "1",
      status: "in_progress",
      orderIndex: 3,
    },
  ];

  await db.write(async () => {
    for (const item of initialItems) {
      await collection.create((task) => {
        task.description = item.description;
        task.category = item.category;
        task.startDate = item.startDate;
        task.endDate = item.endDate ?? null;
        task.recurrenceType = item.recurrenceType;
        task.recurrenceValue = item.recurrenceValue;
        task.status = item.status ?? "in_progress";
        task.orderIndex = item.orderIndex ?? 0;
      });
    }
  });
}

export * from "./schema";
export * from "./models/Task";
