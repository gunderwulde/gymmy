import { exerciseVariables } from "./variables";
import type { Exercise, HistoryEntry } from "./types";

/** Por encima de estas repeticiones la estimación del 1RM deja de ser fiable. */
export const MAX_RELIABLE_REPS = 12;

export interface ProgressPoint {
  date: string;
  value: number;
  entry: HistoryEntry;
}

export interface ProgressSeries {
  title: string;
  unit: string;
  points: ProgressPoint[];
}

export interface Scale {
  min: number;
  max: number;
  ticks: number[];
}

/**
 * 1RM estimado a partir de peso y repeticiones: media de Epley
 * (peso·(1 + reps/30)) y Brzycki (peso·36 / (37 − reps)), que coinciden a 10
 * repeticiones y divergen fuera de ese punto. Con una repetición el 1RM es el
 * propio peso y las repeticiones se limitan a `MAX_RELIABLE_REPS`.
 */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  const capped = Math.min(reps, MAX_RELIABLE_REPS);
  const epley = weight * (1 + capped / 30);
  const brzycki = (weight * 36) / (37 - capped);
  return (epley + brzycki) / 2;
}

function dayKey(date: string): string {
  const value = new Date(date);
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

export function buildProgressSeries(
  exercise: Exercise,
  history: HistoryEntry[],
): ProgressSeries {
  const variables = exerciseVariables(exercise);
  const hasStrength =
    variables.some((variable) => variable.var === "peso") &&
    variables.some((variable) => variable.var === "repeticiones");
  const first = variables[0];

  let title = "Progreso";
  let unit = "";
  let measure: (entry: HistoryEntry) => number | null;
  if (exercise.tracking === "time") {
    title = "Duración";
    unit = "min";
    measure = (entry) =>
      entry.mode === "time" ? entry.durationSeconds / 60 : null;
  } else if (hasStrength) {
    title = "1RM estimado";
    unit = "kg";
    measure = (entry) => {
      const weight = entry.values?.peso;
      const reps = entry.values?.repeticiones;
      return weight === undefined || reps === undefined
        ? null
        : estimateOneRepMax(weight, reps);
    };
  } else {
    title = first?.txt ?? title;
    measure = (entry) => (first ? (entry.values?.[first.var] ?? null) : null);
  }

  const bestByDay = new Map<string, ProgressPoint>();
  for (const entry of history) {
    if (entry.exerciseId !== exercise.id) continue;
    const value = measure(entry);
    if (value === null) continue;
    const key = dayKey(entry.date);
    const current = bestByDay.get(key);
    if (!current || value > current.value) {
      bestByDay.set(key, { date: entry.date, value, entry });
    }
  }
  const points = [...bestByDay.values()].sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date),
  );
  return { title, unit, points };
}

export function niceScale(min: number, max: number, target = 4): Scale {
  let low = min;
  let high = max;
  if (low === high) {
    const pad = Math.max(1, Math.abs(low) * 0.1);
    low -= pad;
    high += pad;
  }
  const rough = (high - low) / target;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / magnitude;
  const step =
    (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) *
    magnitude;
  const start = Math.floor(low / step) * step;
  const end = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= end + step / 2; value += step) {
    ticks.push(Number(value.toFixed(6)));
  }
  return { min: ticks[0], max: ticks[ticks.length - 1], ticks };
}
