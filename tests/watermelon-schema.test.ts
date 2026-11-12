import { describe, it, expect } from "vitest";
import { schema } from "@/lib/db/schema";
import { isSupabaseConfigured } from "@/lib/db/sync";
import { Task } from "@/lib/db/models/Task";

describe("WatermelonDB Tasks Schema", () => {
  it("should define the tasks table correctly", () => {
    const tasksTable = schema.tables.tasks;
    expect(tasksTable).toBeDefined();
    expect(tasksTable.name).toBe("tasks");

    const columnNames = Object.keys(tasksTable.columns);
    expect(columnNames).toContain("user_id");
    expect(columnNames).toContain("description");
    expect(columnNames).toContain("category");
    expect(columnNames).toContain("start_date");
    expect(columnNames).toContain("end_date");
    expect(columnNames).toContain("recurrence_type");
    expect(columnNames).toContain("recurrence_value");
    expect(columnNames).toContain("status");
    expect(columnNames).toContain("order_index");
    expect(columnNames).toContain("created_at");
    expect(columnNames).toContain("updated_at");
  });

  it("should have correct column types", () => {
    const tasksTable = schema.tables.tasks;
    expect(tasksTable.columns.description.type).toBe("string");
    expect(tasksTable.columns.category.type).toBe("string");
    expect(tasksTable.columns.start_date.type).toBe("number");
    expect(tasksTable.columns.end_date.type).toBe("number");
    expect(tasksTable.columns.end_date.isOptional).toBe(true);
    expect(tasksTable.columns.recurrence_type.type).toBe("string");
    expect(tasksTable.columns.recurrence_value.type).toBe("string");
    expect(tasksTable.columns.status.type).toBe("string");
    expect(tasksTable.columns.order_index.type).toBe("number");
  });

  it("should detect Supabase configuration helper", () => {
    expect(typeof isSupabaseConfigured).toBe("function");
  });

  it("should correctly serialize and deserialize Task fields through getters and setters", () => {
    const mockCollection = {
      schema: {
        columns: {
          description: { name: "description", type: "string" },
          category: { name: "category", type: "string" },
          start_date: { name: "start_date", type: "number" },
          end_date: { name: "end_date", type: "number", isOptional: true },
          recurrence_type: { name: "recurrence_type", type: "string" },
          recurrence_value: { name: "recurrence_value", type: "string" },
          status: { name: "status", type: "string" },
          order_index: { name: "order_index", type: "number" },
          created_at: { name: "created_at", type: "number" },
          updated_at: { name: "updated_at", type: "number" },
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const task = new Task(mockCollection as any, {
      id: "task-test-1",
      description: "",
      category: "",
      start_date: 0,
      end_date: null,
      recurrence_type: "daily",
      recurrence_value: "1",
      status: "in_progress",
      order_index: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Simula modo de edição do WatermelonDB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (task as any)._isEditing = true;

    task.description = "Treino Funcional 45m";
    task.category = "Saúde";
    const testDate = new Date("2026-11-12T10:00:00Z");
    task.startDate = testDate;
    task.recurrenceType = "interval";
    task.recurrenceValue = "2";
    task.status = "completed";
    task.orderIndex = 5;

    expect(task.description).toBe("Treino Funcional 45m");
    expect(task.category).toBe("Saúde");
    expect(task.startDate.getTime()).toBe(testDate.getTime());
    expect(task.recurrenceType).toBe("interval");
    expect(task.recurrenceValue).toBe("2");
    expect(task.status).toBe("completed");
    expect(task.orderIndex).toBe(5);

    // Valida que o _raw interno do WatermelonDB foi devidamente gravado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (task as any)._raw;
    expect(raw.description).toBe("Treino Funcional 45m");
    expect(raw.category).toBe("Saúde");
    expect(raw.start_date).toBe(testDate.getTime());
    expect(raw.recurrence_type).toBe("interval");
    expect(raw.recurrence_value).toBe("2");
    expect(raw.status).toBe("completed");
    expect(raw.order_index).toBe(5);
  });
});
