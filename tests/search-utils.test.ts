import { describe, it, expect } from "vitest";
import { normalizeSearchText } from "@/lib/utils";

describe("Search Normalization (Accent and Case Insensitive)", () => {
  it("should normalize accents, uppercase letters and spaces", () => {
    expect(normalizeSearchText("Programação")).toBe("programacao");
    expect(normalizeSearchText("Estudo de Inglês")).toBe("estudo de ingles");
    expect(normalizeSearchText("AÇÃO & REAÇÃO")).toBe("acao & reacao");
    expect(normalizeSearchText("Saúde e Bem-Estar")).toBe("saude e bem-estar");
  });

  it("should match queries regardless of diacritics", () => {
    const taskName = "Apresentação de Finanças";
    const userQueryWithoutAccents = "apresentacao";
    const userQueryWithAccents = "APRESENTAÇÃO";

    expect(normalizeSearchText(taskName).includes(normalizeSearchText(userQueryWithoutAccents))).toBe(true);
    expect(normalizeSearchText(taskName).includes(normalizeSearchText(userQueryWithAccents))).toBe(true);
  });

  it("should handle null or empty values gracefully", () => {
    expect(normalizeSearchText("")).toBe("");
    expect(normalizeSearchText(null)).toBe("");
    expect(normalizeSearchText(undefined)).toBe("");
  });
});
