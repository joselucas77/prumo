import { Model } from "@nozbe/watermelondb";
import { date, field, readonly, text, writer } from "@nozbe/watermelondb/decorators";

export type TaskStatus = "completed" | "in_progress" | "archived";
export type RecurrenceType = "daily" | "interval" | "specific_days";

export class Task extends Model {
  static table = "tasks";

  @text("description") description!: string;
  @text("category") category!: string;
  @date("start_date") startDate!: Date;
  @date("end_date") endDate?: Date | null;
  @text("recurrence_type") recurrenceType!: RecurrenceType;
  @text("recurrence_value") recurrenceValue!: string;
  @text("status") status!: TaskStatus;
  @field("order_index") orderIndex!: number;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;

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

  @writer async markAsArchived() {
    await this.update((record) => {
      record.status = "archived";
    });
  }

  @writer async remove() {
    await this.markAsDeleted();
  }
}
