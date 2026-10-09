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
  }
}

export const database = new GymmyDatabase();

export function isExerciseValue(value: unknown): value is ExerciseValue {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ExerciseValue>;
  return (
    typeof item.exerciseId === "string" &&
    item.exerciseId.length > 0 &&
    Number.isFinite(item.weight) &&
    (item.weight ?? -1) >= 0 &&
    Number.isInteger(item.reps) &&
    (item.reps ?? 0) >= 1
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
      item.durationSeconds >= 1
    );
  }
  return (
    (item.mode === undefined || item.mode === "sets") &&
    typeof item.weight === "number" &&
    Number.isFinite(item.weight) &&
    item.weight >= 0 &&
    typeof item.reps === "number" &&
    Number.isInteger(item.reps) &&
    item.reps >= 1
  );
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

export async function addTimeEntry(entry: HistoryEntry): Promise<HistoryEntry> {
  return database.transaction(
    "rw",
    database.history,
    database.sessions,
    async () => {
      const id = await database.history.add(entry);
      await database.sessions.delete("active");
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
