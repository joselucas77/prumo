import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza o texto removendo acentos, diacríticos e convertendo para minúsculas
 * para busca insensível a maiúsculas/minúsculas e acentuação.
 * Exemplo: "Programação Rápida" -> "programacao rapida"
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
