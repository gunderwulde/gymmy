import { readFile, readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  exerciseZone,
  latestEntry,
  loadCatalog,
  sortByLatestUsage,
  validateCatalog,
} from "../src/catalog";
import type { Exercise } from "../src/types";

const catalog = loadCatalog();

describe("catálogo", () => {
  it("agrupa las zonas del catálogo en los filtros de la lista", () => {
    expect(exerciseZone("chest")).toBe("upper");
    expect(exerciseZone("core")).toBe("upper");
    expect(exerciseZone("legs")).toBe("lower");
    expect(exerciseZone("glutes")).toBe("lower");
    expect(exerciseZone("cardio")).toBe("cardio");
    expect(exerciseZone("unknown")).toBe("all");
  });

  it("valida entradas e ilustraciones locales existentes sin archivos sobrantes", async () => {
    expect(validateCatalog(catalog)).toEqual(catalog);
    const usedImages = new Set(catalog.map((exercise) => `${exercise.id}.svg`));
    const imageFiles = await readdir(
      new URL("../assets/exercises/", import.meta.url),
    );
    expect(new Set(imageFiles)).toEqual(usedImages);
    for (const exercise of catalog) {
      await expect(
        readFile(new URL(`../${exercise.image}`, import.meta.url)),
      ).resolves.toBeDefined();
    }
  });

  it("rechaza ids duplicados, imágenes remotas y campos de tiempo incompatibles", () => {
    expect(() => validateCatalog([catalog[0], catalog[0]])).toThrow(
      /duplicado/,
    );
    expect(() =>
      validateCatalog([
        { ...catalog[0], image: "https://example.com/image.svg" },
      ]),
    ).toThrow(/inválida/);
    const treadmill = catalog.find(
      (exercise) => exercise.id === "cinta-correr",
    )!;
    expect(() => validateCatalog([{ ...treadmill, defaultWeight: 0 }])).toThrow(
      /no debe definir peso/,
    );
    expect(() =>
      validateCatalog([{ ...catalog[0], defaultReps: undefined }]),
    ).toThrow(/valores iniciales/);
  });

  it("selecciona la última entrada y ordena las actividades recientes primero", () => {
    const entries = [
      { exerciseId: "press-banca", date: "2026-01-01T10:00:00.000Z" },
      { exerciseId: "sentadilla", date: "2026-01-03T10:00:00.000Z" },
      { exerciseId: "press-banca", date: "2026-01-02T10:00:00.000Z" },
    ];
    expect(latestEntry(entries, "press-banca")).toBe(entries[2]);
    expect(latestEntry(entries, "jalon-polea")).toBeNull();
    const activities = [
      "press-banca",
      "bicicleta-estatica",
      "cinta-correr",
      "sentadilla",
      "pec-deck",
    ].map((id) => catalog.find((exercise) => exercise.id === id) as Exercise);
    expect(
      sortByLatestUsage(activities, entries).map((exercise) => exercise.id),
    ).toEqual([
      "sentadilla",
      "press-banca",
      "bicicleta-estatica",
      "cinta-correr",
      "pec-deck",
    ]);
  });
});
