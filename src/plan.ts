import {
  exerciseVariables,
  formatVariableValues,
  parseVariableValue,
} from "./variables";
import type { Exercise } from "./types";

/** Versión del protocolo de respuesta de la IA. */
export const PLAN_VERSION = 1;
/** Etiqueta del bloque de código con el plan en la respuesta de la IA. */
export const PLAN_FENCE = "gymmy-plan";
/** Calentamiento fijo: se hace todos los días, sea cual sea la rutina. */
export const WARMUP_ID = "cinta-correr";
export const WARMUP_MINUTES = 20;

export const WEEKDAYS = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

export interface Routine {
  id: string;
  name: string;
  /** Días de la semana (`lun`…`dom`) en los que toca la rutina. */
  days: string[];
  exercises: string[];
}

export interface PlanTarget {
  values: Record<string, number>;
  /** Duración objetivo en minutos (actividades temporizadas). */
  minutes?: number;
}

export interface Plan {
  routines: Routine[];
  targets: Record<string, PlanTarget>;
  /** Ejercicios que se hacen todos los días (calentamiento). */
  daily: string[];
  notes: string;
}

export interface PlanRecord {
  id: "current";
  plan: Plan;
  receivedAt: string;
  /** Rutina elegida a mano para un día concreto (`YYYY-MM-DD`, local). */
  override: { day: string; routineId: string | null } | null;
}

export type ParsedPlan =
  { ok: true; plan: Plan; warnings: string[] } | { ok: false; error: string };

export interface PlanChange {
  exerciseId: string;
  name: string;
  before: string;
  after: string;
}

const number = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

export function localDayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizeDay(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const key = stripAccents(value).toLowerCase().slice(0, 3);
  return WEEKDAYS.includes(key) ? key : null;
}

function slug(text: string): string {
  return (
    stripAccents(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "rutina"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function candidates(text: string): string[] {
  const found: string[] = [];
  const fence = /```([\w-]*)[^\S\n]*\n([\s\S]*?)```/g;
  for (const match of text.matchAll(fence)) {
    if (match[1] === PLAN_FENCE) found.unshift(match[2]);
    else found.push(match[2]);
  }
  found.push(text);
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) found.push(text.slice(start, end + 1));
  return found;
}

function parseRoutines(
  raw: unknown,
  known: Map<string, Exercise>,
  warnings: string[],
): Routine[] {
  const routines: Routine[] = [];
  for (const item of Array.isArray(raw) ? raw : []) {
    if (!isRecord(item) || typeof item.name !== "string" || !item.name.trim()) {
      warnings.push("Se ignoró una rutina sin nombre.");
      continue;
    }
    const name = item.name.trim();
    const id =
      typeof item.id === "string" && item.id ? slug(item.id) : slug(name);
    if (routines.some((routine) => routine.id === id)) {
      warnings.push(`Rutina repetida ignorada: «${name}».`);
      continue;
    }
    const days: string[] = [];
    for (const day of Array.isArray(item.days) ? item.days : []) {
      const normalized = normalizeDay(day);
      if (normalized) days.push(normalized);
      else warnings.push(`Día no reconocido en «${name}».`);
    }
    const exercises: string[] = [];
    for (const exerciseId of Array.isArray(item.exercises)
      ? item.exercises
      : []) {
      if (typeof exerciseId === "string" && known.has(exerciseId)) {
        exercises.push(exerciseId);
      } else {
        warnings.push(
          `Ejercicio desconocido en «${name}»: ${String(exerciseId)}.`,
        );
      }
    }
    routines.push({
      id,
      name,
      days: [...new Set(days)],
      exercises: [...new Set(exercises)],
    });
  }
  return routines;
}

function parseTargets(
  raw: unknown,
  known: Map<string, Exercise>,
  warnings: string[],
): Record<string, PlanTarget> {
  const targets: Record<string, PlanTarget> = {};
  for (const [exerciseId, item] of Object.entries(isRecord(raw) ? raw : {})) {
    const exercise = known.get(exerciseId);
    if (!exercise || !isRecord(item)) {
      warnings.push(`Objetivo ignorado: ${exerciseId}.`);
      continue;
    }
    const variables = exerciseVariables(exercise);
    const values: Record<string, number> = {};
    for (const [key, value] of Object.entries(
      isRecord(item.values) ? item.values : {},
    )) {
      const variable = variables.find((candidate) => candidate.var === key);
      const parsed =
        variable && (typeof value === "number" || typeof value === "string")
          ? parseVariableValue(String(value), variable)
          : null;
      if (parsed === null) {
        warnings.push(`Valor inválido ignorado: ${exercise.name} · ${key}.`);
      } else {
        values[key] = parsed;
      }
    }
    const target: PlanTarget = { values };
    if (
      exercise.tracking === "time" &&
      typeof item.minutes === "number" &&
      item.minutes > 0
    ) {
      target.minutes = item.minutes;
    }
    if (Object.keys(values).length || target.minutes !== undefined) {
      targets[exerciseId] = target;
    }
  }
  return targets;
}

/**
 * Interpreta la respuesta de la IA: busca el bloque ```gymmy-plan (o cualquier
 * JSON con `"gymmy": 1`), lo valida contra el catálogo y devuelve el plan
 * normalizado. Lo que no se reconoce se descarta con un aviso.
 */
export function parsePlan(text: string, catalog: Exercise[]): ParsedPlan {
  let raw: Record<string, unknown> | null = null;
  for (const candidate of candidates(text)) {
    try {
      const parsed: unknown = JSON.parse(candidate.trim());
      if (isRecord(parsed) && parsed.gymmy === PLAN_VERSION) {
        raw = parsed;
        break;
      }
    } catch {
      // Se prueba con el siguiente candidato.
    }
  }
  if (!raw) {
    return {
      ok: false,
      error: `No se encontró un plan de Gymmy (bloque «${PLAN_FENCE}» con "gymmy": ${PLAN_VERSION}).`,
    };
  }

  const warnings: string[] = [];
  const known = new Map(catalog.map((exercise) => [exercise.id, exercise]));
  const routines = parseRoutines(raw.routines, known, warnings);
  const targets = parseTargets(raw.targets, known, warnings);

  if (!routines.length && !Object.keys(targets).length) {
    return {
      ok: false,
      error: "El plan no contiene rutinas ni objetivos válidos.",
    };
  }
  const daily = known.has(WARMUP_ID) ? [WARMUP_ID] : [];
  if (daily.length) {
    targets[WARMUP_ID] = {
      values: targets[WARMUP_ID]?.values ?? {},
      minutes: WARMUP_MINUTES,
    };
  }

  return {
    ok: true,
    plan: {
      routines,
      targets,
      daily,
      notes: typeof raw.notes === "string" ? raw.notes.trim() : "",
    },
    warnings,
  };
}

/** Rutina que toca en la fecha dada según los días de la semana del plan. */
export function routineForDate(plan: Plan, date: Date): Routine | null {
  const weekday = WEEKDAYS[date.getDay()];
  return (
    plan.routines.find((routine) => routine.days.includes(weekday)) ?? null
  );
}

/** Id de la rutina de hoy: la elegida a mano hoy o, si no, la del calendario. */
export function activeRoutineId(record: PlanRecord, date: Date): string | null {
  if (record.override && record.override.day === localDayKey(date)) {
    return record.override.routineId;
  }
  return routineForDate(record.plan, date)?.id ?? null;
}

/** Ejercicios de hoy (calentamiento + rutina activa). */
export function todayExerciseIds(
  plan: Plan,
  routineId: string | null,
): Set<string> {
  const routine = plan.routines.find((item) => item.id === routineId);
  return new Set([...plan.daily, ...(routine?.exercises ?? [])]);
}

/** Texto compacto del objetivo, p. ej. «42,5 kg × 10» o «20 min · Inclinación: 1». */
export function targetText(exercise: Exercise, target: PlanTarget): string {
  const { peso, repeticiones, ...rest } = target.values;
  const parts: string[] = [];
  if (target.minutes !== undefined) {
    parts.push(`${number.format(target.minutes)} min`);
  }
  if (peso !== undefined && repeticiones !== undefined) {
    parts.push(`${number.format(peso)} kg × ${number.format(repeticiones)}`);
  } else {
    if (peso !== undefined) parts.push(`${number.format(peso)} kg`);
    if (repeticiones !== undefined) {
      parts.push(`${number.format(repeticiones)} rep.`);
    }
  }
  const others = formatVariableValues(exerciseVariables(exercise), rest);
  if (others) parts.push(others);
  return parts.join(" · ");
}

/** Cambios que produciría aplicar el plan sobre los valores actuales. */
export function planChanges(
  plan: Plan,
  catalog: Exercise[],
  current: Record<string, Record<string, string>>,
): PlanChange[] {
  const changes: PlanChange[] = [];
  for (const exercise of catalog) {
    const target = plan.targets[exercise.id];
    if (!target) continue;
    const variables = exerciseVariables(exercise);
    const before: Record<string, number> = {};
    for (const variable of variables) {
      const parsed = parseVariableValue(
        current[exercise.id]?.[variable.var] ?? String(variable.default),
        variable,
      );
      if (parsed !== null) before[variable.var] = parsed;
    }
    const after = { ...before, ...target.values };
    changes.push({
      exerciseId: exercise.id,
      name: exercise.name,
      before: formatVariableValues(variables, before),
      after: [
        target.minutes !== undefined
          ? `${number.format(target.minutes)} min`
          : "",
        formatVariableValues(variables, after),
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }
  return changes;
}
