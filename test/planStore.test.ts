import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { reactive } from "vue";
import { loadCatalog } from "../src/catalog";
import { parsePlan } from "../src/plan";
import { database } from "../src/storage/database";
import { useWorkoutStore } from "../src/stores/workout";

describe("aplicar plan en el store", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await database.open();
    await Promise.all([
      database.plans.clear(),
      database.exerciseValues.clear(),
      database.history.clear(),
    ]);
  });

  it("guarda un plan reactivo, actualiza valores y permite elegir rutina", async () => {
    const result = parsePlan(
      JSON.stringify({
        gymmy: 1,
        routines: [{ name: "Empuje", days: ["lun"], exercises: ["pec-deck"] }],
        targets: { "pec-deck": { values: { peso: 45, repeticiones: 8 } } },
      }),
      loadCatalog(),
    );
    if (!result.ok) throw new Error(result.error);
    const store = useWorkoutStore();
    await store.load();
    expect(await store.applyPlan(reactive(result.plan))).toBe(true);
    expect(store.values["pec-deck"]).toEqual({ peso: "45", repeticiones: "8" });
    expect(await database.exerciseValues.get("pec-deck")).toMatchObject({
      values: { peso: 45, repeticiones: 8 },
    });
    await store.selectRoutine("empuje");
    expect((await database.plans.get("current"))?.override?.routineId).toBe(
      "empuje",
    );
  });
});
