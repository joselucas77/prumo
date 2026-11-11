import { Model } from "@nozbe/watermelondb";
import { writer } from "@nozbe/watermelondb/decorators";

export type TaskStatus = "completed" | "in_progress" | "archived";
export type RecurrenceType = "daily" | "interval" | "specific_days";

export class Task extends Model {
  static table = "tasks";

  get description(): string {
    return (this._getRaw("description") as string) || "";
  }
  set description(value: string) {
    this._setRaw("description", typeof value === "string" ? value.trim() : "");
  }

  get category(): string {
    return (this._getRaw("category") as string) || "Geral";
  }
  set category(value: string) {
    this._setRaw("category", typeof value === "string" ? value.trim() : "Geral");
  }

  get startDate(): Date {
    const raw = this._getRaw("start_date");
    return raw ? new Date(Number(raw)) : new Date();
  }
  set startDate(value: Date) {
    const timestamp = value instanceof Date ? value.getTime() : (value ? new Date(value).getTime() : Date.now());
    this._setRaw("start_date", timestamp);
  }

  get endDate(): Date | null {
    const raw = this._getRaw("end_date");
    return raw ? new Date(Number(raw)) : null;
  }
  set endDate(value: Date | null | undefined) {
    const timestamp = value instanceof Date ? value.getTime() : (value ? new Date(value).getTime() : null);
    this._setRaw("end_date", timestamp);
  }

  get recurrenceType(): RecurrenceType {
    return (this._getRaw("recurrence_type") as RecurrenceType) || "daily";
  }
  set recurrenceType(value: RecurrenceType) {
    this._setRaw("recurrence_type", value || "daily");
  }

  get recurrenceValue(): string {
    return (this._getRaw("recurrence_value") as string) || "1";
  }
  set recurrenceValue(value: string) {
    this._setRaw("recurrence_value", typeof value === "string" ? value : String(value ?? "1"));
  }

  get status(): TaskStatus {
    return (this._getRaw("status") as TaskStatus) || "in_progress";
  }
  set status(value: TaskStatus) {
    this._setRaw("status", value || "in_progress");
  }

  get orderIndex(): number {
    return Number(this._getRaw("order_index") ?? 0);
  }
  set orderIndex(value: number) {
    this._setRaw("order_index", Number(value ?? 0));
  }

  get createdAt(): Date {
    const raw = this._getRaw("created_at");
    return raw ? new Date(Number(raw)) : new Date();
  }

  get updatedAt(): Date {
    const raw = this._getRaw("updated_at");
    return raw ? new Date(Number(raw)) : new Date();
  }

  @writer async updateStatus(newStatus: TaskStatus) {
    await this.update((record) => {
      record.status = newStatus;
    });
  }

  @writer async toggleCompleted() {
    await this.update((record) => {
      record.status = record.status === "completed" ? "in_progress" : "completed";
    });
  }

  @writer async updateOrder(newOrder: number) {
    await this.update((record) => {
      record.orderIndex = newOrder;
    });
  }

  @writer async updateDetails(data: {
    description?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date | null;
    recurrenceType?: RecurrenceType;
    recurrenceValue?: string;
    status?: TaskStatus;
    orderIndex?: number;
  }) {
    await this.update((record) => {
      if (data.description !== undefined) record.description = data.description;
      if (data.category !== undefined) record.category = data.category;
      if (data.startDate !== undefined) record.startDate = data.startDate;
      if (data.endDate !== undefined) record.endDate = data.endDate;
      if (data.recurrenceType !== undefined) record.recurrenceType = data.recurrenceType;
      if (data.recurrenceValue !== undefined) record.recurrenceValue = data.recurrenceValue;
      if (data.status !== undefined) record.status = data.status;
      if (data.orderIndex !== undefined) record.orderIndex = data.orderIndex;
    });
  }
}
