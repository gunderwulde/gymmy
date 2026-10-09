import Dexie, { type Table } from "dexie";
import type { ExerciseValue, HistoryEntry, TimerSession } from "../types";

export interface BackupRecord {
  id?: number;
  createdAt: string;
  source: "indexeddb";
  payload: {
    values: unknown[];
    history: unknown[];
    timer: unknown;
  };
}

export class GymmyDatabase extends Dexie {
  exerciseValues!: Table<ExerciseValue, string>;
  history!: Table<HistoryEntry, number>;
  sessions!: Table<TimerSession, string>;
  backups!: Table<BackupRecord, number>;

  constructor(name = "gymmy") {
    super(name);
    this.version(1).stores({
      exerciseValues: "&exerciseId",
      history: "++id, exerciseId, date",
      sessions: "&id",
      backups: "++id, createdAt",
    });
    this.version(2)
      .stores({
        exerciseValues: "&exerciseId",
        history: "++id, exerciseId, date",
        sessions: "&id",
        backups: "++id, createdAt",
      })
      .upgrade((transaction) =>
        transaction
          .table("sessions")
          .toCollection()
          .modify((session: Record<string, unknown>) => {
            if (
              session.id === "active" &&
              typeof session.exerciseId === "string" &&
              session.exerciseId.length > 0 &&
              typeof session.elapsedMs === "number" &&
              Number.isFinite(session.elapsedMs) &&
              session.elapsedMs >= 0 &&
              session.startedAt === undefined
            ) {
              session.startedAt = null;
            }
          }),
      );
    this.version(3)
      .stores({
        exerciseValues: "&exerciseId",
        history: "++id, exerciseId, date",
        sessions: "&id",
        backups: "++id, createdAt",
      })
      .upgrade(async (transaction) => {
        await transaction
          .table("exerciseValues")
          .toCollection()
          .modify((value: Record<string, unknown>) => {
            if (
              value.values === undefined &&
              typeof value.weight === "number" &&
              Number.isFinite(value.weight) &&
              value.weight >= 0 &&
              typeof value.reps === "number" &&
              Number.isInteger(value.reps) &&
              value.reps >= 1
            ) {
              value.values = {
                peso: value.weight,
                repeticiones: value.reps,
              };
              delete value.weight;
              delete value.reps;
            }
          });
        await transaction
          .table("history")
          .toCollection()
          .modify((entry: Record<string, unknown>) => {
            if (
              entry.mode !== "time" &&
              entry.values === undefined &&
              typeof entry.weight === "number" &&
              Number.isFinite(entry.weight) &&
              entry.weight >= 0 &&
              typeof entry.reps === "number" &&
              Number.isInteger(entry.reps) &&
              entry.reps >= 1
            ) {
              entry.mode = "sets";
              entry.values = {
                peso: entry.weight,
                repeticiones: entry.reps,
              };
              delete entry.weight;
              delete entry.reps;
            }
          });
      });
  }
}

export const database = new GymmyDatabase();

function isVariableValues(value: unknown, allowEmpty = false): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    (allowEmpty || entries.length > 0) &&
    entries.every(
      ([key, number]) =>
        /^[a-z][a-z0-9_-]*$/.test(key) &&
        typeof number === "number" &&
        Number.isFinite(number) &&
        number >= 0 &&
        (key !== "repeticiones" || (Number.isInteger(number) && number >= 1)),
    )
  );
}

export function isExerciseValue(value: unknown): value is ExerciseValue {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ExerciseValue>;
  return (
    typeof item.exerciseId === "string" &&
    item.exerciseId.length > 0 &&
    isVariableValues(item.values)
  );
}

export function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  const dateValid =
    typeof item.date === "string" && !Number.isNaN(Date.parse(item.date));
  const idValid =
    item.id === undefined ||
    (typeof item.id === "number" && Number.isInteger(item.id));
  if (
    !idValid ||
    typeof item.exerciseId !== "string" ||
    !item.exerciseId ||
    !dateValid
  )
    return false;
  if (item.mode === "time") {
    return (
      typeof item.durationSeconds === "number" &&
      Number.isInteger(item.durationSeconds) &&
      item.durationSeconds >= 1 &&
      (item.values === undefined || isVariableValues(item.values))
    );
  }
  return item.mode === "sets" && isVariableValues(item.values);
}

export function isTimerSession(value: unknown): value is TimerSession {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<TimerSession>;
  return (
    item.id === "active" &&
    typeof item.exerciseId === "string" &&
    item.exerciseId.length > 0 &&
    Number.isFinite(item.elapsedMs) &&
    (item.elapsedMs ?? -1) >= 0 &&
    (item.startedAt === null || Number.isFinite(item.startedAt))
  );
}

export async function loadWorkoutData() {
  await database.open();
  const [values, history, timer] = await Promise.all([
    database.exerciseValues.toArray(),
    database.history.toArray(),
    database.sessions.get("active"),
  ]);
  const invalidValues = values.filter((item) => !isExerciseValue(item));
  const invalidHistory = history.filter((item) => !isHistoryEntry(item));
  const invalidTimer = timer !== undefined && !isTimerSession(timer);
  if (invalidValues.length || invalidHistory.length || invalidTimer) {
    await database.backups.add({
      createdAt: new Date().toISOString(),
      source: "indexeddb",
      payload: {
        values,
        history,
        timer,
      },
    });
    return {
      values: values.filter(isExerciseValue),
      history: history.filter(isHistoryEntry),
      timer: isTimerSession(timer) ? timer : null,
      warning:
        "Hay datos de entrenamiento dañados. Se guardó una copia en IndexedDB y la app no los modificará.",
      blocked: true,
    };
  }
  return { values, history, timer: timer ?? null, warning: "", blocked: false };
}

export async function saveExerciseValue(value: ExerciseValue): Promise<void> {
  await database.exerciseValues.put(value);
}

export async function addSetEntry(
  entry: HistoryEntry,
  value: ExerciseValue,
): Promise<HistoryEntry> {
  return database.transaction(
    "rw",
    database.history,
    database.exerciseValues,
    async () => {
      const id = await database.history.add(entry);
      await database.exerciseValues.put(value);
      return { ...entry, id };
    },
  );
}

export async function addTimeEntry(
  entry: HistoryEntry,
  value?: ExerciseValue,
): Promise<HistoryEntry> {
  return database.transaction(
    "rw",
    database.history,
    database.sessions,
    database.exerciseValues,
    async () => {
      const id = await database.history.add(entry);
      await database.sessions.delete("active");
      if (value) await database.exerciseValues.put(value);
      return { ...entry, id };
    },
  );
}

export async function saveTimerSession(session: TimerSession): Promise<void> {
  await database.sessions.put(session);
}

export async function clearTimerSession(): Promise<void> {
  await database.sessions.delete("active");
}
