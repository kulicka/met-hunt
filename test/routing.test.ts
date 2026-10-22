import { describe, expect, it } from "vitest";
import type { ClosureOverride } from "@/data/closures";
import { quests } from "@/data/hidden-treasures/quests";
import {
  galleryConnections,
  galleryNodes,
  routeValidations,
  type GalleryConnection,
} from "@/data/maps/met-floor2-european-paintings";
import { nextUnsolved, openUnsolved, questOrder } from "@/lib/content";
import { findRoute } from "@/lib/routing";

const closed = (...ids: string[]): ClosureOverride[] => ids.map((galleryId) => ({ galleryId, status: "closed" }));
const door = (from: string, to: string, verified = true): GalleryConnection => ({
  id: `${from}-${to}`,
  from,
  to,
  bidirectional: true,
  type: "doorway",
  verified,
});

describe("gallery graph (spec v2)", () => {
  it("never connects 817 and 818 directly", () => {
    expect(
      galleryConnections.some((e) => (e.from === "817" && e.to === "818") || (e.from === "818" && e.to === "817")),
    ).toBe(false);
  });

  it("keeps quest order separate from connectivity", () => {
    expect(questOrder).toEqual(["810", "815", "816", "817", "818", "819", "821", "822", "824", "825"]);
  });

  it("only connects galleries that exist on the map, with unique ids", () => {
    const ids = new Set(galleryNodes.map((n) => n.id));
    for (const c of galleryConnections) {
      expect(ids.has(c.from), c.id).toBe(true);
      expect(ids.has(c.to), c.id).toBe(true);
    }
    expect(new Set(galleryConnections.map((c) => c.id)).size).toBe(galleryConnections.length);
  });

  it("records a source for every verified connection", () => {
    for (const c of galleryConnections.filter((c) => c.verified)) {
      expect(c.source, c.id).toBeTruthy();
      expect(c.verifiedAt, c.id).toBeTruthy();
    }
  });

  it("every step of every quest route uses a verified doorway", () => {
    const verified = new Set(galleryConnections.filter((c) => c.verified).flatMap((c) => [`${c.from}|${c.to}`, `${c.to}|${c.from}`]));
    for (let i = 1; i < questOrder.length; i++) {
      const route = findRoute(questOrder[i - 1], questOrder[i], []);
      if (!route) continue;
      for (let s = 1; s < route.path.length; s++) {
        expect(verified.has(`${route.path[s - 1]}|${route.path[s]}`), route.path.join("→")).toBe(true);
      }
    }
  });
});

describe("findRoute", () => {
  const graph = [door("A", "B"), door("B", "C"), door("A", "D"), door("D", "E"), door("E", "C")];

  it("finds the shortest verified walk, through non-game rooms if needed", () => {
    expect(findRoute("A", "C", [], graph)?.path).toEqual(["A", "B", "C"]);
  });

  it("recalculates around a closed intermediate gallery", () => {
    expect(findRoute("A", "C", closed("B"), graph)?.path).toEqual(["A", "D", "E", "C"]);
  });

  it("returns null when every route is closed (official-map fallback)", () => {
    expect(findRoute("A", "C", closed("B", "D"), graph)).toBeNull();
  });

  it("never routes through an unverified connection", () => {
    expect(findRoute("A", "C", [], [door("A", "B"), door("B", "C", false)])).toBeNull();
  });

  it("respects a closed connection", () => {
    expect(findRoute("A", "C", [{ connectionId: "B-C", status: "closed" }], graph)?.path).toEqual(["A", "D", "E", "C"]);
  });

  it("gives no route into a closed destination", () => {
    expect(findRoute("A", "C", closed("C"), graph)).toBeNull();
  });

  it("uses verified intervening rooms for 817 → 818 when they exist, or falls back", () => {
    const route = findRoute("817", "818", []);
    if (route) {
      expect(route.path.length).toBeGreaterThan(2);
    } else {
      expect(route).toBeNull();
    }
  });
});

describe("closures", () => {
  it("make a closed quest gallery skippable without touching riddles", () => {
    const before = JSON.stringify(quests);
    const c = closed("816");
    expect(openUnsolved([], c)).not.toContain(3);
    expect(nextUnsolved(2, [1, 2], c)).toBe(4);
    expect(JSON.stringify(quests)).toBe(before);
  });
});

describe.runIf(process.env.LAUNCH_CHECK)("launch readiness", () => {
  it("has a RouteValidation record for all nine quest transitions", () => {
    for (let i = 1; i < questOrder.length; i++) {
      const found = routeValidations.find((v) => v.fromQuestGallery === questOrder[i - 1] && v.toQuestGallery === questOrder[i]);
      expect(found, `${questOrder[i - 1]} → ${questOrder[i]}`).toBeTruthy();
    }
  });
});
