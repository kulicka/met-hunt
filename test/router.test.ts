import { describe, expect, it } from "vitest";
import { parseRoute, routeHash } from "@/components/game/router";

describe("routes", () => {
  it("tells starting a hunt apart from switching adventures", () => {
    expect(parseRoute(routeHash({ name: "adventures", start: true }))).toEqual({ name: "adventures", start: true });
    expect(parseRoute(routeHash({ name: "adventures" }))).toEqual({ name: "adventures" });
  });
});
