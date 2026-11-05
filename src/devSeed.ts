import { loadCatalog } from "./catalog";
import { database } from "./storage/database";
import type { Exercise, HistoryEntry } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let value = 2166136261;
  for (const char of text) {
    value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  }
  return value >>> 0;
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Historial de ejemplo válido para cada ejercicio del catálogo: una entrada
 * cada 3-4 días durante `days` días (sin incluir hoy), con progresión de carga
 * y ruido. Es determinista para un mismo `seed`.
 */
export function generateSampleHistory(
  catalog: Exercise[],
  now: Date,
  days = 84,
  seed = 1,
): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  for (const exercise of catalog) {
    const random = createRandom(hash(exercise.id) ^ seed);
    const timed = exercise.tracking === "time";
    let weight = roundTo(
      (exercise.v1?.var === "peso" ? exercise.v1.default : 20) * 0.75,
      2.5,
    );
    let reps = 8;
    let session = 0;
    for (
      let offset = days;
      offset >= 1;
      offset -= 3 + Math.floor(random() * 2)
    ) {
      const date = new Date(now.getTime() - offset * DAY_MS);
      date.setHours(
        17 + Math.floor(random() * 3),
        Math.floor(random() * 60),
        0,
        0,
      );
      session += 1;
      if (timed) {
        const durationSeconds = Math.round(
          (15 + session * 0.6 + random() * 10) * 60,
        );
        const variable = exercise.v1;
        const values: Record<string, number> = {};
        if (variable?.var === "inclinacion") {
          values.inclinacion = roundTo(random() * 6, 0.5);
        } else if (variable?.var === "resistencia") {
          values.resistencia = 1 + Math.floor(random() * 8);
        } else if (variable) {
          values[variable.var] = variable.default;
        }
        entries.push({
          exerciseId: exercise.id,
          mode: "time",
          durationSeconds,
          ...(Object.keys(values).length ? { values } : {}),
          date: date.toISOString(),
        });
        continue;
      }
      reps += random() < 0.6 ? 1 : 0;
      if (reps > 12) {
        reps = 8;
        weight += 2.5;
      }
      const values: Record<string, number> = {};
      for (const variable of [exercise.v1, exercise.v2, exercise.v3]) {
        if (!variable) continue;
        if (variable.var === "peso") values.peso = weight;
        else if (variable.var === "repeticiones") {
          values.repeticiones = Math.max(
            1,
            reps + Math.round((random() - 0.5) * 2),
          );
        } else values[variable.var] = variable.default;
      }
      entries.push({
        exerciseId: exercise.id,
        mode: "sets",
        values,
        date: date.toISOString(),
      });
    }
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

/** Solo desarrollo: expone `gymmySeed()` en la consola del navegador. */
export function installDevSeed(): void {
  Reflect.set(
    globalThis,
    "gymmySeed",
    async (options?: { force?: boolean }): Promise<string> => {
      await database.open();
      if (!options?.force && (await database.history.count()) > 0) {
        return "Ya hay historial. Usa gymmySeed({ force: true }) para añadir los datos de ejemplo igualmente.";
      }
      const entries = generateSampleHistory(loadCatalog(), new Date());
      await database.history.bulkAdd(entries);
      return `${entries.length} registros de ejemplo añadidos. Recarga la página.`;
    },
  );
}
