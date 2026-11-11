import { describe, it, expect } from "vitest";
import { schema } from "@/lib/db/schema";
import { isSupabaseConfigured } from "@/lib/db/sync";

describe("WatermelonDB Tasks Schema", () => {
  it("should define the tasks table correctly", () => {
    const tasksTable = schema.tables.tasks;
    expect(tasksTable).toBeDefined();
    expect(tasksTable.name).toBe("tasks");

    const columnNames = Object.keys(tasksTable.columns);
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
});
