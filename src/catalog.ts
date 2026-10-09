import catalogData from "../data/exercises.json";
import type { Exercise, ExerciseVariable, ExerciseZone } from "./types";

const ZONE_BY_GROUP: Record<string, Exclude<ExerciseZone, "all">> = {
  chest: "upper",
  back: "upper",
  shoulders: "upper",
  arms: "upper",
  core: "upper",
  legs: "lower",
  glutes: "lower",
  cardio: "cardio",
};

export function exerciseZone(muscleGroup: string): ExerciseZone {
  return ZONE_BY_GROUP[muscleGroup] ?? "all";
}

const REQUIRED_GROUPS = new Set([
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "glutes",
  "core",
  "cardio",
]);

function isExerciseVariable(value: unknown): value is ExerciseVariable {
  if (!value || typeof value !== "object") return false;
  const variable = value as Record<string, unknown>;
  return (
    typeof variable.var === "string" &&
    /^[a-z][a-z0-9_-]*$/.test(variable.var) &&
    typeof variable.txt === "string" &&
    variable.txt.trim() !== "" &&
    typeof variable.default === "number" &&
    Number.isFinite(variable.default) &&
    variable.default >= 0 &&
    (variable.var !== "repeticiones" ||
      (Number.isInteger(variable.default) && variable.default >= 1))
  );
}

export function validateCatalog(value: unknown): Exercise[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(
      "El catálogo de ejercicios está vacío o no tiene un formato válido.",
    );
  }
  const ids = new Set<string>();
  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      !("id" in item) ||
      typeof item.id !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) ||
      !("name" in item) ||
      typeof item.name !== "string" ||
      item.name.trim() === "" ||
      !("type" in item) ||
      !["machine", "exercise"].includes(String(item.type)) ||
      ("tracking" in item &&
        !["sets", "time"].includes(String(item.tracking))) ||
      !("muscleGroup" in item) ||
      typeof item.muscleGroup !== "string" ||
      !REQUIRED_GROUPS.has(item.muscleGroup) ||
      !("image" in item) ||
      typeof item.image !== "string" ||
      !/^assets\/exercises\/[a-z0-9-]+\.(?:svg|webp)$/.test(item.image)
    ) {
      throw new Error(
        `Hay una entrada incompleta o inválida en el catálogo${item && "id" in item ? ` (${String(item.id)})` : ""}.`,
      );
    }
    const exercise = item as Exercise;
    const variables = [exercise.v1, exercise.v2, exercise.v3];
    const configuredVariables = variables.filter(
      (variable): variable is ExerciseVariable => variable !== undefined,
    );
    const variableNames = new Set<string>();
    const hasInvalidVariable = configuredVariables.some((variable) => {
      if (!isExerciseVariable(variable) || variableNames.has(variable.var)) {
        return true;
      }
      variableNames.add(variable.var);
      return false;
    });
    const hasGap = variables.some(
      (variable, index) =>
        variable === undefined &&
        variables.slice(index + 1).some((later) => later !== undefined),
    );
    if (
      hasInvalidVariable ||
      hasGap ||
      ("defaultWeight" in item && item.defaultWeight !== undefined) ||
      ("defaultReps" in item && item.defaultReps !== undefined)
    ) {
      throw new Error(
        `Las variables de «${exercise.id}» están incompletas o son inválidas.`,
      );
    }
    if (exercise.tracking === "time") {
      if (exercise.v2 || exercise.v3) {
        throw new Error(
          `La actividad por tiempo «${exercise.id}» solo puede definir v1.`,
        );
      }
    } else if (configuredVariables.length === 0) {
      throw new Error(
        `El ejercicio «${exercise.id}» debe definir al menos una variable.`,
      );
    }
    if (ids.has(exercise.id)) {
      throw new Error(
        `El catálogo contiene el identificador duplicado «${exercise.id}».`,
      );
    }
    ids.add(exercise.id);
  }
  return value as Exercise[];
}

export function loadCatalog(): Exercise[] {
  return validateCatalog(catalogData);
}

export function latestEntry<T extends { exerciseId: string; date: string }>(
  history: T[],
  exerciseId: string,
): T | null {
  let latest: T | null = null;
  for (const entry of history) {
    if (
      entry.exerciseId === exerciseId &&
      (!latest || Date.parse(entry.date) > Date.parse(latest.date))
    ) {
      latest = entry;
    }
  }
  return latest;
}

export function sortByLatestUsage<T extends { id: string }>(
  catalog: T[],
  history: Array<{ exerciseId: string; date: string }>,
): T[] {
  const latestDates = new Map<string, number>();
  for (const entry of history) {
    const date = Date.parse(entry.date);
    if (
      !latestDates.has(entry.exerciseId) ||
      date > latestDates.get(entry.exerciseId)!
    ) {
      latestDates.set(entry.exerciseId, date);
    }
  }
  return catalog
    .map((exercise, index) => ({
      exercise,
      index,
      lastUsed: latestDates.get(exercise.id) ?? null,
    }))
    .sort((a, b) => {
      if (a.lastUsed === null && b.lastUsed !== null) return 1;
      if (a.lastUsed !== null && b.lastUsed === null) return -1;
      return (b.lastUsed ?? 0) - (a.lastUsed ?? 0) || a.index - b.index;
    })
    .map(({ exercise }) => exercise);
}
