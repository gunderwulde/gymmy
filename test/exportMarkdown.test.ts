import { describe, expect, it } from "vitest";
import { loadCatalog } from "../src/catalog";
import { generateSampleHistory } from "../src/devSeed";
import { buildRoutineMarkdown } from "../src/exportMarkdown";

const catalog = loadCatalog();
const now = new Date(2026, 5, 15, 12);

describe("exportación a Markdown", () => {
  it("incluye petición, resumen y todos los ejercicios", () => {
    const markdown = buildRoutineMarkdown(
      catalog,
      generateSampleHistory(catalog, now),
      now,
    );
    expect(markdown).toContain("# Mis rutinas de gimnasio (Gymmy)");
    expect(markdown).toContain("## Petición");
    expect(markdown).toContain("1RM estimado");
    for (const exercise of catalog) {
      expect(markdown).toContain(`### ${exercise.name}`);
    }
    expect(markdown.endsWith("\n")).toBe(true);
  });

  it("indica los ejercicios sin registros", () => {
    const markdown = buildRoutineMarkdown(catalog, [], now);
    expect(markdown).toContain("Sin registros todavía.");
    expect(markdown).toContain("Registros totales: 0");
  });
});
