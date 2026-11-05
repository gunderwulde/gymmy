import { describe, expect, it } from "vitest";
import { loadCatalog } from "../src/catalog";
import { generateSampleHistory } from "../src/devSeed";
import {
  buildProgressSeries,
  estimateOneRepMax,
  niceScale,
} from "../src/progress";
import { isHistoryEntry } from "../src/storage/database";
import { exerciseVariables, parseVariableValues } from "../src/variables";
import type { Exercise, HistoryEntry } from "../src/types";

const catalog = loadCatalog();
const pecDeck = catalog.find(
  (exercise) => exercise.id === "pec-deck",
) as Exercise;
const treadmill = catalog.find(
  (exercise) => exercise.id === "cinta-correr",
) as Exercise;

describe("progreso", () => {
  it("estima el 1RM con la media de Epley y Brzycki", () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.33, 1);
    expect(estimateOneRepMax(100, 6)).toBeCloseTo(118.06, 1);
    expect(estimateOneRepMax(100, 30)).toBe(estimateOneRepMax(100, 12));
  });

  it("construye la serie con el mejor valor de cada día y en orden", () => {
    const entries: HistoryEntry[] = [
      {
        exerciseId: "pec-deck",
        mode: "sets",
        values: { peso: 40, repeticiones: 10 },
        date: new Date(2026, 0, 3, 10).toISOString(),
      },
      {
        exerciseId: "pec-deck",
        mode: "sets",
        values: { peso: 30, repeticiones: 10 },
        date: new Date(2026, 0, 1, 10).toISOString(),
      },
      {
        exerciseId: "pec-deck",
        mode: "sets",
        values: { peso: 20, repeticiones: 5 },
        date: new Date(2026, 0, 1, 18).toISOString(),
      },
      {
        exerciseId: "otro",
        mode: "sets",
        values: { peso: 99, repeticiones: 1 },
        date: new Date(2026, 0, 2).toISOString(),
      },
    ];
    const series = buildProgressSeries(pecDeck, entries);
    expect(series.title).toBe("1RM estimado");
    expect(series.points).toHaveLength(2);
    expect(series.points[0].value).toBeCloseTo(estimateOneRepMax(30, 10), 5);
    expect(series.points[1].value).toBeGreaterThan(series.points[0].value);
  });

  it("usa la duración en minutos para actividades temporizadas", () => {
    const series = buildProgressSeries(treadmill, [
      {
        exerciseId: "cinta-correr",
        mode: "time",
        durationSeconds: 1800,
        date: new Date(2026, 0, 1).toISOString(),
      },
    ]);
    expect(series).toMatchObject({ title: "Duración", unit: "min" });
    expect(series.points[0].value).toBe(30);
  });

  it("calcula una escala con marcas redondas que envuelve los datos", () => {
    const scale = niceScale(31.2, 47.9);
    expect(scale.min).toBeLessThanOrEqual(31.2);
    expect(scale.max).toBeGreaterThanOrEqual(47.9);
    expect(scale.ticks.length).toBeGreaterThanOrEqual(3);
    expect(niceScale(5, 5).ticks.length).toBeGreaterThanOrEqual(2);
  });
});

describe("historial de ejemplo", () => {
  const now = new Date(2026, 5, 15, 12);
  const entries = generateSampleHistory(catalog, now);

  it("genera entradas válidas para todos los ejercicios del catálogo", () => {
    for (const exercise of catalog) {
      const own = entries.filter((entry) => entry.exerciseId === exercise.id);
      expect(own.length).toBeGreaterThan(10);
      for (const entry of own) {
        expect(isHistoryEntry(entry)).toBe(true);
        expect(entry.mode).toBe(exercise.tracking === "time" ? "time" : "sets");
        if (entry.values) {
          const draft = Object.fromEntries(
            Object.entries(entry.values).map(([key, value]) => [
              key,
              String(value),
            ]),
          );
          expect(
            parseVariableValues(exerciseVariables(exercise), draft),
          ).not.toBeNull();
        }
      }
    }
  });

  it("no incluye hoy, es determinista y deja series con progresión", () => {
    expect(
      entries.every((entry) => Date.parse(entry.date) < now.getTime()),
    ).toBe(true);
    expect(generateSampleHistory(catalog, now)).toEqual(entries);
    const series = buildProgressSeries(pecDeck, entries);
    expect(series.points.length).toBeGreaterThan(10);
    expect(series.points.at(-1)!.value).toBeGreaterThan(series.points[0].value);
  });
});
