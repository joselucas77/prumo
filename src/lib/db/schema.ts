import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: "tasks",
      columns: [
        { name: "description", type: "string" },
        { name: "category", type: "string" },
        { name: "start_date", type: "number" },
        { name: "end_date", type: "number", isOptional: true },
        { name: "recurrence_type", type: "string" },
        { name: "recurrence_value", type: "string" },
        { name: "status", type: "string" },
        { name: "order_index", type: "number" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
  ],
});
