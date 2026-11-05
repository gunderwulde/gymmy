import { beforeEach, describe, expect, it } from "vitest";
import { loadCatalog, sortForToday } from "../src/catalog";
import { buildRoutineMarkdown } from "../src/exportMarkdown";
import {
  activeRoutineId,
  parsePlan,
  planChanges,
  routineForDate,
  targetText,
  todayExerciseIds,
  type PlanRecord,
} from "../src/plan";
import {
  applyPlanRecord,
  database,
  loadPlanRecord,
} from "../src/storage/database";

const catalog = loadCatalog();
const answer = `Te propongo esto:

\`\`\`gymmy-plan
{
  "gymmy": 1,
  "routines": [
    { "id": "empuje", "name": "Empuje", "days": ["Lunes", "jue"], "exercises": ["pec-deck", "press-hombros", "no-existe"] },
    { "name": "Tirón", "days": ["martes"], "exercises": ["jalon-polea"] }
  ],
  "targets": {
    "pec-deck": { "values": { "peso": "42,5", "repeticiones": 10 } },
    "jalon-polea": { "values": { "peso": 50, "repeticiones": 0 } },
    "cinta-correr": { "minutes": 30, "values": { "inclinacion": 2 } }
  },
  "notes": "Sube 2,5 kg"
}
\`\`\`
`;

describe("plan de la IA", () => {
  it("interpreta el bloque, normaliza y avisa de lo descartado", () => {
    const result = parsePlan(answer, catalog);
    if (!result.ok) throw new Error(result.error);
    const { plan, warnings } = result;
    expect(plan.routines.map((routine) => routine.id)).toEqual([
      "empuje",
      "tiron",
    ]);
    expect(plan.routines[0].days).toEqual(["lun", "jue"]);
    expect(plan.routines[0].exercises).toEqual(["pec-deck", "press-hombros"]);
    expect(plan.targets["pec-deck"].values).toEqual({
      peso: 42.5,
      repeticiones: 10,
    });
    expect(plan.targets["jalon-polea"].values).toEqual({ peso: 50 });
    expect(warnings.length).toBeGreaterThanOrEqual(2);
    expect(plan.notes).toBe("Sube 2,5 kg");
  });

  it("fuerza el calentamiento diario de 20 minutos en la cinta", () => {
    const result = parsePlan(answer, catalog);
    if (!result.ok) throw new Error(result.error);
    expect(result.plan.daily).toEqual(["cinta-correr"]);
    expect(result.plan.targets["cinta-correr"]).toEqual({
      values: { inclinacion: 2 },
      minutes: 20,
    });
  });

  it("rechaza respuestas sin plan", () => {
    expect(parsePlan("Hola, sigue así", catalog).ok).toBe(false);
    expect(parsePlan('{"gymmy": 1}', catalog).ok).toBe(false);
  });

  it("acepta JSON sin vallas de código", () => {
    const json = answer.slice(answer.indexOf("{"), answer.lastIndexOf("}") + 1);
    expect(parsePlan(json, catalog).ok).toBe(true);
  });

  it("el ejemplo del .md exportado es un plan válido", () => {
    const markdown = buildRoutineMarkdown(catalog, []);
    expect(markdown).toContain("Protocolo de respuesta");
    expect(markdown).toContain("`pec-deck`");
    const result = parsePlan(markdown, catalog);
    expect(result.ok).toBe(true);
  });

  it("elige la rutina por día de la semana y permite cambiarla a mano", () => {
    const result = parsePlan(answer, catalog);
    if (!result.ok) throw new Error(result.error);
    const monday = new Date(2026, 5, 15, 12);
    const wednesday = new Date(2026, 5, 17, 12);
    expect(routineForDate(result.plan, monday)?.id).toBe("empuje");
    expect(routineForDate(result.plan, wednesday)).toBeNull();
    const record: PlanRecord = {
      id: "current",
      plan: result.plan,
      receivedAt: monday.toISOString(),
      override: { day: "2026-06-15", routineId: "tiron" },
    };
    expect(activeRoutineId(record, monday)).toBe("tiron");
    expect(activeRoutineId(record, wednesday)).toBeNull();
    const ids = todayExerciseIds(result.plan, "empuje");
    expect([...ids].sort()).toEqual([
      "cinta-correr",
      "pec-deck",
      "press-hombros",
    ]);
  });

  it("describe objetivos y cambios", () => {
    const result = parsePlan(answer, catalog);
    if (!result.ok) throw new Error(result.error);
    const pecDeck = catalog.find((item) => item.id === "pec-deck")!;
    const treadmill = catalog.find((item) => item.id === "cinta-correr")!;
    expect(targetText(pecDeck, result.plan.targets["pec-deck"])).toBe(
      "42,5 kg × 10",
    );
    expect(targetText(treadmill, result.plan.targets["cinta-correr"])).toBe(
      "20 min · Inclinación (%): 2",
    );
    const changes = planChanges(result.plan, catalog, {
      "pec-deck": { peso: "40", repeticiones: "10" },
    });
    expect(
      changes.find((item) => item.exerciseId === "pec-deck"),
    ).toMatchObject({
      before: expect.stringContaining("40"),
      after: expect.stringContaining("42,5"),
    });
  });
});

describe("orden con plan", () => {
  it("pone primero los ejercicios de hoy y, dentro, los pendientes", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const day = new Date(2026, 5, 15, 12);
    const history = [{ exerciseId: "b", date: day.toISOString() }];
    expect(
      sortForToday(items, history, day, new Set(["b", "c"])).map((i) => i.id),
    ).toEqual(["c", "b", "a", "d"]);
    expect(sortForToday(items, history, day, null).map((i) => i.id)).toEqual([
      "a",
      "c",
      "d",
      "b",
    ]);
  });
});

describe("persistencia del plan", () => {
  beforeEach(async () => {
    await database.open();
    await database.plans.clear();
    await database.exerciseValues.clear();
  });

  it("guarda plan y valores juntos y los recupera", async () => {
    const result = parsePlan(answer, catalog);
    if (!result.ok) throw new Error(result.error);
    const record: PlanRecord = {
      id: "current",
      plan: result.plan,
      receivedAt: new Date().toISOString(),
      override: null,
    };
    await applyPlanRecord(record, [
      { exerciseId: "pec-deck", values: { peso: 42.5, repeticiones: 10 } },
    ]);
    expect(await loadPlanRecord()).toEqual(record);
    expect(await database.exerciseValues.count()).toBe(1);
  });
});
