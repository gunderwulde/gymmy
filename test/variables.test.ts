import { describe, expect, it } from "vitest";
import {
  exerciseVariables,
  formatVariableValues,
  parseVariableValue,
  parseVariableValues,
} from "../src/variables";
import { loadCatalog } from "../src/catalog";

const catalog = loadCatalog();

describe("variables configurables", () => {
  it("acepta decimales con coma y exige repeticiones enteras positivas", () => {
    const [weight, reps] = exerciseVariables(catalog[0]);
    expect(parseVariableValue("12,5", weight)).toBe(12.5);
    expect(parseVariableValue("0", weight)).toBe(0);
    expect(parseVariableValue("-1", weight)).toBeNull();
    expect(parseVariableValue("8", reps)).toBe(8);
    expect(parseVariableValue("8,0", reps)).toBeNull();
    expect(parseVariableValue("0", reps)).toBeNull();
  });

  it("convierte borradores y formatea los valores con sus etiquetas", () => {
    const exercise = catalog[0];
    const variables = exerciseVariables(exercise);
    const values = parseVariableValues(variables, {
      peso: "32,5",
      repeticiones: "9",
    });
    expect(values).toEqual({ peso: 32.5, repeticiones: 9 });
    expect(formatVariableValues(variables, values ?? undefined)).toBe(
      "Peso (kg): 32,5 · Repeticiones: 9",
    );
    expect(
      parseVariableValues(variables, { peso: "32,5", repeticiones: "" }),
    ).toBeNull();
  });

  it("permite actividades temporizadas sin variable complementaria", () => {
    expect(parseVariableValues([], undefined)).toEqual({});
  });

  it("mantiene la etiqueta de distancia en historiales previos de cinta", () => {
    const treadmill = catalog.find(
      (exercise) => exercise.id === "cinta-correr",
    );
    expect(treadmill).toBeDefined();
    expect(
      formatVariableValues(exerciseVariables(treadmill!), { distancia: 2.5 }),
    ).toBe("Distancia (km): 2,5");
  });
});
