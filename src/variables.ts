import type { Exercise, ExerciseVariable } from "./types";

export const REPETITIONS_VARIABLE = "repeticiones";

const LEGACY_VARIABLE_LABELS: Record<string, string> = {
  distancia: "Distancia (km)",
};

export function exerciseVariables(exercise: Exercise): ExerciseVariable[] {
  return [exercise.v1, exercise.v2, exercise.v3].filter(
    (variable): variable is ExerciseVariable => variable !== undefined,
  );
}

export function parseVariableValue(
  value: string,
  variable: ExerciseVariable,
): number | null {
  const trimmed = value.trim();
  if (variable.var === REPETITIONS_VARIABLE && !/^\d+$/.test(trimmed)) {
    return null;
  }
  const normalized = trimmed.replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  if (
    variable.var === REPETITIONS_VARIABLE &&
    (!Number.isSafeInteger(parsed) || parsed < 1)
  ) {
    return null;
  }
  return parsed;
}

export function parseVariableValues(
  variables: ExerciseVariable[],
  draft: Record<string, string> | undefined,
): Record<string, number> | null {
  const values: Record<string, number> = {};
  for (const variable of variables) {
    const value = parseVariableValue(draft?.[variable.var] ?? "", variable);
    if (value === null) return null;
    values[variable.var] = value;
  }
  return values;
}

export function formatVariableValues(
  variables: ExerciseVariable[],
  values: Record<string, number> | undefined,
): string {
  if (!values) return "";
  return Object.entries(values)
    .map(([key, value]) => {
      const label =
        variables.find((variable) => variable.var === key)?.txt ??
        LEGACY_VARIABLE_LABELS[key] ??
        key;
      const formatted = new Intl.NumberFormat("es-ES", {
        maximumFractionDigits: 2,
      }).format(value);
      return `${label}: ${formatted}`;
    })
    .join(" · ");
}
