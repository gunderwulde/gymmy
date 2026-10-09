import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../src/storage/database";
import { useWorkoutStore } from "../src/stores/workout";

describe("sesiones temporizadas", () => {
  let now: ReturnType<typeof vi.spyOn>;
  let store: ReturnType<typeof useWorkoutStore> | null = null;

  beforeEach(async () => {
    setActivePinia(createPinia());
    await database.open();
    await Promise.all([
      database.exerciseValues.clear(),
      database.history.clear(),
      database.sessions.clear(),
      database.backups.clear(),
    ]);
    now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
  });

  afterEach(() => {
    store?.stopTicker();
    store = null;
    vi.restoreAllMocks();
  });

  it("recupera el tramo tras el reposo y excluye la pausa al reanudar", async () => {
    store = useWorkoutStore();
    await store.load();
    store.updateDraft("cinta-correr", "inclinacion", "2,5");
    await store.saveDraft("cinta-correr");
    await store.startTimer("cinta-correr");

    const startedSession = await database.sessions.get("active");
    expect(startedSession).toMatchObject({
      elapsedMs: 0,
      startedAt: 1_000_000,
    });

    store.stopTicker();
    now.mockReturnValue(4_660_500);
    setActivePinia(createPinia());
    store = useWorkoutStore();
    await store.load();

    expect(store.timerElapsed("cinta-correr")).toBe(3_660_500);
    await store.pauseTimer();
    expect(await database.sessions.get("active")).toMatchObject({
      elapsedMs: 3_660_500,
      startedAt: null,
    });

    now.mockReturnValue(8_260_500);
    expect(store.timerElapsed("cinta-correr")).toBe(3_660_500);
    await store.resumeTimer();
    expect(await database.sessions.get("active")).toMatchObject({
      elapsedMs: 3_660_500,
      startedAt: 8_260_500,
    });

    now.mockReturnValue(8_263_000);
    await expect(store.finishTimer()).resolves.toBe(true);
    expect(store.history[0]).toMatchObject({
      mode: "time",
      durationSeconds: 3_663,
      values: { inclinacion: 2.5 },
    });
    expect(await database.exerciseValues.get("cinta-correr")).toEqual({
      exerciseId: "cinta-correr",
      values: { inclinacion: 2.5 },
    });
    expect(await database.sessions.get("active")).toBeUndefined();
  });

  it("registra las variables configuradas en ejercicios por series", async () => {
    store = useWorkoutStore();
    await store.load();
    const exercise = store.catalog.find((item) => item.id === "press-banca");
    expect(exercise).toBeDefined();
    store.updateDraft("press-banca", "peso", "32,5");
    store.updateDraft("press-banca", "repeticiones", "9");

    await expect(store.recordSet(exercise!)).resolves.toBe(true);
    expect(store.history[0]).toMatchObject({
      exerciseId: "press-banca",
      mode: "sets",
      values: { peso: 32.5, repeticiones: 9 },
    });
    expect(await database.exerciseValues.get("press-banca")).toEqual({
      exerciseId: "press-banca",
      values: { peso: 32.5, repeticiones: 9 },
    });
  });
});
