import { describe, expect, it } from "vitest";
import { readSharedData } from "../src/sharedData";

describe("datos compartidos", () => {
  it("lee título, texto y enlace", () => {
    expect(
      readSharedData("?title=Plan&text=Hola%20mundo&url=https%3A%2F%2Fa.b"),
    ).toEqual({
      title: "Plan",
      text: "Hola mundo",
      url: "https://a.b",
    });
  });

  it("devuelve null si no hay datos", () => {
    expect(readSharedData("")).toBeNull();
    expect(readSharedData("?otro=1&text=%20")).toBeNull();
  });
});
