import { describe, expect, it } from "vitest";
import {
  elapsedMilliseconds,
  formatElapsedTime,
  parseReps,
  parseWeight,
} from "../src/timer";

describe("validación y cronómetro", () => {
  it("acepta coma decimal y valida pesos y repeticiones", () => {
    expect(parseWeight("12,5")).toBe(12.5);
    expect(parseWeight("-1")).toBeNull();
    expect(parseWeight("abc")).toBeNull();
    expect(parseReps("10")).toBe(10);
    expect(parseReps("0")).toBeNull();
    expect(parseReps("2.5")).toBeNull();
  });

  it("acumula tramos basados en timestamps, excluye pausas y da formato HH:MM:SS", () => {
    expect(formatElapsedTime(3_661_999)).toBe("01:01:01");
    expect(
      elapsedMilliseconds(
        { elapsedMs: 5000, startedAt: null, exerciseId: "walk" },
        100_000,
      ),
    ).toBe(5000);
    expect(
      elapsedMilliseconds(
        { elapsedMs: 5000, startedAt: 100_000, exerciseId: "walk" },
        102_500,
      ),
    ).toBe(7500);
    expect(
      elapsedMilliseconds(
        { elapsedMs: 7500, startedAt: 200_000, exerciseId: "walk" },
        800_000,
      ),
    ).toBe(607_500);
    expect(
      elapsedMilliseconds(
        { elapsedMs: 7500, startedAt: 200_000, exerciseId: "walk" },
        100_000,
      ),
    ).toBe(7500);
  });
});
