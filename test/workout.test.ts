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
    });
    expect(await database.sessions.get("active")).toBeUndefined();
  });
});
