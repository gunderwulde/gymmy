import { beforeEach, describe, expect, it } from "vitest";
import Dexie from "dexie";
import {
  GymmyDatabase,
  addSetEntry,
  database,
  isExerciseValue,
  isHistoryEntry,
  isTimerSession,
  loadWorkoutData,
} from "../src/storage/database";

describe("persistencia IndexedDB", () => {
  beforeEach(async () => {
    await database.open();
    await Promise.all([
      database.exerciseValues.clear(),
      database.history.clear(),
      database.sessions.clear(),
      database.backups.clear(),
    ]);
  });

  it("valida y guarda valores e historial en tablas IndexedDB", async () => {
    const value = { exerciseId: "press-banca", weight: 30.5, reps: 8 };
    const entry = {
      exerciseId: "press-banca",
      mode: "sets" as const,
      weight: 30.5,
      reps: 8,
      date: "2026-01-02T10:00:00.000Z",
    };
    expect(isExerciseValue(value)).toBe(true);
    expect(isHistoryEntry(entry)).toBe(true);
    await addSetEntry(entry, value);
    const loaded = await loadWorkoutData();
    expect(loaded.values).toEqual([value]);
    expect(loaded.history).toHaveLength(1);
    expect(loaded.history[0]).toMatchObject(entry);
    expect(loaded.blocked).toBe(false);
  });

  it("respalda registros dañados en IndexedDB y bloquea sobrescrituras", async () => {
    await database.exerciseValues.put({
      exerciseId: "invalid",
      weight: -4,
      reps: 0,
    } as never);
    const loaded = await loadWorkoutData();
    expect(loaded.blocked).toBe(true);
    expect(loaded.warning).toMatch(/copia/);
    const backups = await database.backups.toArray();
    expect(backups).toHaveLength(1);
    expect(backups[0].payload.values).toHaveLength(1);
    expect(await database.exerciseValues.count()).toBe(1);
  });

  it("migra las sesiones del cronómetro existentes como pausadas", async () => {
    const name = "gymmy-timer-session-migration";
    const legacyDatabase = new Dexie(name);
    legacyDatabase.version(1).stores({ sessions: "&id" });
    await legacyDatabase.open();
    await legacyDatabase.table("sessions").put({
      id: "active",
      exerciseId: "cinta-correr",
      elapsedMs: 12_500,
    });
    legacyDatabase.close();

    const upgradedDatabase = new GymmyDatabase(name);
    try {
      await upgradedDatabase.open();
      const session = await upgradedDatabase.sessions.get("active");
      expect(session).toEqual({
        id: "active",
        exerciseId: "cinta-correr",
        elapsedMs: 12_500,
        startedAt: null,
      });
      expect(isTimerSession(session)).toBe(true);
    } finally {
      await upgradedDatabase.delete();
    }
  });
});
