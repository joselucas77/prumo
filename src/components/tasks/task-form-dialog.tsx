"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { BoxIcon } from "@/components/ui/box-icon";
import { Task, type TaskStatus, type RecurrenceType } from "@/lib/db";
import { toast } from "sonner";

interface TaskFormData {
  description: string;
  category: string;
  startDate: Date;
  endDate?: Date | null;
  recurrenceType: RecurrenceType;
  recurrenceValue: string;
  status: TaskStatus;
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: Task | null;
  categories?: string[];
  onSubmit: (data: TaskFormData) => Promise<void>;
}

const CATEGORY_SUGGESTIONS = ["Planejamento", "Trabalho", "Saúde", "Estudos", "Pessoal", "Finanças"];
const DAYS_OF_WEEK = [
  { key: "dom", label: "D" },
  { key: "seg", label: "S" },
  { key: "ter", label: "T" },
  { key: "qua", label: "Q" },
  { key: "qui", label: "Q" },
  { key: "sex", label: "S" },
  { key: "sab", label: "S" },
];

function TaskFormContent({
  taskToEdit,
  availableCategories = [],
  isMobile,
  onCancel,
  onSubmit,
}: {
  taskToEdit?: Task | null;
  availableCategories?: string[];
  isMobile: boolean;
  onCancel: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);

  const [description, setDescription] = React.useState(() => taskToEdit?.description || "");
  const [category, setCategory] = React.useState(() => taskToEdit?.category || "Planejamento");

  const categoryOptions = React.useMemo(() => {
    const set = new Set([...CATEGORY_SUGGESTIONS, ...availableCategories]);
    if (category && category.trim()) {
      set.add(category.trim());
    }
    return Array.from(set).sort();
  }, [availableCategories, category]);
  const [startDateStr, setStartDateStr] = React.useState(() => {
    if (taskToEdit?.startDate) {
      return new Date(taskToEdit.startDate).toISOString().slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
  });
  const [endDateStr, setEndDateStr] = React.useState(() => {
    if (taskToEdit?.endDate) {
      return new Date(taskToEdit.endDate).toISOString().slice(0, 10);
    }
    return "";
  });
  const [recurrenceType, setRecurrenceType] = React.useState<RecurrenceType>(
    () => taskToEdit?.recurrenceType || "daily"
  );
  const [intervalDays, setIntervalDays] = React.useState(() => {
    if (taskToEdit?.recurrenceType === "interval") {
      return taskToEdit.recurrenceValue || "1";
    }
    return "1";
  });
  const [selectedDays, setSelectedDays] = React.useState<string[]>(() => {
    if (taskToEdit?.recurrenceType === "specific_days") {
      try {
        const parsed = JSON.parse(taskToEdit.recurrenceValue);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return ["seg", "qua", "sex"];
  });
  const [status, setStatus] = React.useState<TaskStatus>(() => taskToEdit?.status || "in_progress");

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Informe a descrição da tarefa.");
      return;
    }

    let finalRecurrenceValue = "";
    if (recurrenceType === "daily") {
      finalRecurrenceValue = "1";
    } else if (recurrenceType === "interval") {
      finalRecurrenceValue = intervalDays || "1";
    } else if (recurrenceType === "specific_days") {
      finalRecurrenceValue = JSON.stringify(selectedDays);
    }

    const start = startDateStr ? new Date(startDateStr + "T00:00:00") : new Date();
    const end = endDateStr ? new Date(endDateStr + "T23:59:59") : null;

    try {
      setBusy(true);
      await onSubmit({
        description: description.trim(),
        category: category.trim(),
        startDate: start,
        endDate: end,
        recurrenceType,
        recurrenceValue: finalRecurrenceValue,
        status,
      });

      toast.success(taskToEdit ? "Tarefa atualizada com sucesso!" : "Tarefa criada com sucesso!");
      onCancel();
    } catch (err: unknown) {
      console.error("Erro ao salvar tarefa:", err);
      toast.error("Não foi possível salvar a tarefa.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* Descrição / Título */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-xs font-semibold text-foreground">
            Descrição / Título da Tarefa *
          </label>
          <Input
            id="description"
            required
            placeholder="Ex: Treino funcional de 40min"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-base md:text-sm font-medium"
          />
        </div>

        {/* Categoria com Combobox (com criação direta de nova categoria) */}
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-xs font-semibold text-foreground">
            Categoria
          </label>
          <Combobox
            id="category"
            value={category}
            onChange={(newCategory) => setCategory(newCategory)}
            options={categoryOptions}
            placeholder="Selecione ou crie uma categoria..."
            searchPlaceholder="Buscar ou digitar nova categoria..."
            allowCreate={true}
          />
        </div>

        {/* Datas de Início e Término */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="startDate" className="text-xs font-semibold text-foreground">
              Data de Início
            </label>
            <DatePicker
              id="startDate"
              value={startDateStr}
              onChange={(dateStr) => setStartDateStr(dateStr)}
              placeholder="Selecione data de início"
              clearable={false}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="endDate" className="text-xs font-semibold text-foreground">
              Data de Término (Opcional)
            </label>
            <DatePicker
              id="endDate"
              value={endDateStr}
              onChange={(dateStr) => setEndDateStr(dateStr)}
              placeholder="Sem data de término"
              clearable={true}
            />
          </div>
        </div>

        {/* Tipo de Recorrência */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">Recorrência</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRecurrenceType("daily")}
              className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                recurrenceType === "daily"
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              <BoxIcon name="sun" className="text-lg" />
              Diária
            </button>
            <button
              type="button"
              onClick={() => setRecurrenceType("interval")}
              className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                recurrenceType === "interval"
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              <BoxIcon name="time" className="text-lg" />
              Intervalo
            </button>
            <button
              type="button"
              onClick={() => setRecurrenceType("specific_days")}
              className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                recurrenceType === "specific_days"
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              <BoxIcon name="calendar-event" className="text-lg" />
              Dias da Semana
            </button>
          </div>

          {recurrenceType === "interval" && (
            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Repetir a cada</span>
              <Input
                type="number"
                min="1"
                max="365"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                className="w-20 text-center h-9 text-base md:text-sm font-semibold"
              />
              <span className="text-xs text-muted-foreground">dias</span>
            </div>
          )}

          {recurrenceType === "specific_days" && (
            <div className="pt-2">
              <span className="text-xs text-muted-foreground block mb-1.5">
                Selecione os dias:
              </span>
              <div className="flex items-center gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const selected = selectedDays.includes(day.key);
                  return (
                    <button
                      type="button"
                      key={day.key}
                      onClick={() => toggleDay(day.key)}
                      className={`h-9 w-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selected
                          ? "bg-primary text-primary-foreground shadow-sm scale-105"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status Inicial / Atual */}
        {taskToEdit && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-foreground">
              Status da Tarefa
            </label>
            <Select
              value={status}
              onValueChange={(val) => setStatus((val as TaskStatus) || "in_progress")}
            >
              <SelectTrigger className="h-10 rounded-xl bg-background text-base md:text-sm">
                <SelectValue placeholder="Selecione o status">
                  {(val) => {
                    if (val === "in_progress") return "Em Andamento";
                    if (val === "completed") return "Concluída";
                    if (val === "archived") return "Arquivada";
                    return String(val || "Em Andamento");
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="archived">Arquivada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isMobile ? (
        <div className="shrink-0 p-4 border-t border-border flex flex-col gap-2 w-full bg-background">
          <Button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl font-bold text-base"
          >
            {busy ? (
              <BoxIcon name="loader-alt" className="animate-spin text-xl mr-2" />
            ) : null}
            Salvar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-10 w-full rounded-xl text-sm text-muted-foreground"
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="p-4 border-t bg-muted/30 flex items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-xl px-5"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={busy}
            className="rounded-xl px-7 font-semibold"
          >
            {busy ? (
              <BoxIcon name="loader-alt" className="animate-spin text-lg mr-2" />
            ) : null}
            Salvar
          </Button>
        </div>
      )}
    </form>
  );
}

export function TaskFormDialog({
  open,
  onOpenChange,
  taskToEdit,
  categories = [],
  onSubmit,
}: TaskFormDialogProps) {
  const isMobile = useIsMobile();

  const handleCancel = () => {
    onOpenChange(false);
  };

  const formKey = open ? (taskToEdit ? `edit-${taskToEdit.id}` : "new-task") : "closed";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerHeader onClose={handleCancel}>
          <DrawerTitle>{taskToEdit ? "Editar Tarefa" : "Nova Tarefa"}</DrawerTitle>
          <DrawerDescription>
            {taskToEdit
              ? "Atualize os detalhes da tarefa salva localmente."
              : "Defina sua meta ou hábito para o Prumo acompanhar."}
          </DrawerDescription>
        </DrawerHeader>
        {open && (
          <TaskFormContent
            key={formKey}
            taskToEdit={taskToEdit}
            availableCategories={categories}
            isMobile={isMobile}
            onCancel={handleCancel}
            onSubmit={onSubmit}
          />
        )}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={handleCancel} />
      <DialogHeader>
        <DialogTitle>{taskToEdit ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        <DialogDescription>
          {taskToEdit
            ? "Atualize os detalhes da sua tarefa."
            : "Defina sua meta ou hábito para o Prumo acompanhar."}
        </DialogDescription>
      </DialogHeader>
      {open && (
        <TaskFormContent
          key={formKey}
          taskToEdit={taskToEdit}
          availableCategories={categories}
          isMobile={isMobile}
          onCancel={handleCancel}
          onSubmit={onSubmit}
        />
      )}
    </Dialog>
  );
}
