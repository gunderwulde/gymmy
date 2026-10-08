import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateCatalog } from "../src/catalog.js";
import { latestEntry, loadState, saveState, validateState, STORAGE_KEY } from "../src/storage.js";
import { elapsedMilliseconds, formatElapsedTime } from "../src/timer.js";

const catalog = JSON.parse(await readFile(new URL("../data/exercises.json", import.meta.url), "utf8"));

test("el catálogo es válido, tiene ids únicos y apunta a imágenes locales existentes", async () => {
  validateCatalog(catalog);
  const ids = new Set(catalog.map(({ id }) => id));
  assert.equal(ids.size, catalog.length);
  assert.equal(catalog.find(({ id }) => id === "cinta-correr")?.tracking, "time");
  assert.equal(catalog.find(({ id }) => id === "bicicleta-estatica")?.tracking, "time");
  for (const exercise of catalog) {
    assert.equal(exercise.image, `assets/exercises/${exercise.id}.svg`);
    await assert.doesNotReject(readFile(new URL(`../${exercise.image}`, import.meta.url)));
  }
});

test("el service worker precachea el catálogo y todas sus ilustraciones", async () => {
  const worker = await readFile(new URL("../sw.js", import.meta.url), "utf8");
  const shell = worker.match(/const APP_SHELL = \[([\s\S]*?)\];/)?.[1];
  assert.ok(shell, "el service worker debe declarar APP_SHELL");
  for (const path of ["./data/exercises.json", "./src/timer.js", ...catalog.map(({ image }) => `./${image}`)]) {
    assert.ok(shell.includes(`"${path}"`), `falta precache para ${path}`);
  }
});

test("la validación del catálogo rechaza ids duplicados e imágenes remotas", () => {
  assert.throws(() => validateCatalog([catalog[0], catalog[0]]), /duplicado/);
  assert.throws(() => validateCatalog([{ ...catalog[0], image: "https://example.com/image.svg" }]), /inválida/);
  const treadmill = catalog.find(({ id }) => id === "cinta-correr");
  assert.throws(() => validateCatalog([{ ...treadmill, defaultWeight: 0 }]), /no debe definir peso/);
});

test("la última serie de un ejercicio se selecciona por fecha", () => {
  const entries = [
    { exerciseId: "press-banca", weight: 20, reps: 10, date: "2026-01-01T10:00:00.000Z" },
    { exerciseId: "sentadilla", weight: 40, reps: 8, date: "2026-01-03T10:00:00.000Z" },
    { exerciseId: "press-banca", weight: 25, reps: 8, date: "2026-01-02T10:00:00.000Z" }
  ];
  assert.equal(latestEntry(entries, "press-banca"), entries[2]);
  assert.equal(latestEntry(entries, "jalon-polea"), null);
});

test("el estado valida registros y rechaza pesos/repeticiones inválidos", () => {
  const state = {
    version: 1,
    values: { sentadilla: { weight: 50.5, reps: 8 } },
    history: [{ exerciseId: "sentadilla", weight: 50.5, reps: 8, date: "2026-01-02T10:00:00.000Z" }]
  };
  assert.equal(validateState(state), state);
  assert.throws(() => validateState({ ...state, values: { sentadilla: { weight: -1, reps: 8 } } }));
  assert.throws(() => validateState({ ...state, history: [{ ...state.history[0], reps: 0 }] }));
});

test("el historial acepta duraciones y mantiene compatibles las series antiguas", () => {
  const state = {
    version: 1,
    values: {},
    history: [
      { exerciseId: "press-banca", weight: 20, reps: 10, date: "2026-01-02T10:00:00.000Z" },
      { exerciseId: "cinta-correr", mode: "time", durationSeconds: 1800, date: "2026-01-03T10:00:00.000Z" }
    ]
  };
  assert.equal(validateState(state), state);
  assert.throws(() => validateState({
    ...state,
    history: [{ ...state.history[1], durationSeconds: 0 }]
  }));
});

test("el cronómetro acumula solo tiempo activo y formatea horas, minutos y segundos", () => {
  assert.equal(formatElapsedTime(3_661_999), "01:01:01");
  assert.equal(elapsedMilliseconds({ elapsedMs: 5000, runningSince: null }, 100_000), 5000);
  assert.equal(elapsedMilliseconds({ elapsedMs: 5000, runningSince: 100_000 }, 102_500), 7500);
});

test("el estado persiste y conserva una copia si encuentra JSON corrupto", () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value))
  };
  const state = { version: 1, values: {}, history: [] };
  saveState(state);
  assert.deepEqual(loadState().state, state);

  const damaged = "{not-json";
  values.set(STORAGE_KEY, damaged);
  const result = loadState();
  assert.match(result.warning, /copia de seguridad/);
  assert.equal(values.get(`${STORAGE_KEY}:corrupt-backup`), damaged);
  assert.equal(values.get(STORAGE_KEY), damaged);
  delete globalThis.localStorage;
});
