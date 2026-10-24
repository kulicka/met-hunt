import { describe, expect, it } from "vitest";
import type { ClosureOverride } from "@/data/closures";
import { europeanPaintings } from "@/adventures/european-paintings";
import { quests } from "@/adventures/european-paintings/quests";
import {
  galleryConnections,
  galleryNodes,
  routeValidations,
  type GalleryConnection,
} from "@/data/maps/met-floor2-european-paintings";
import { contentFor } from "@/lib/content";
import { findRoute as findOn } from "@/lib/routing";

const { nextUnsolved, openUnsolved, questOrder } = contentFor(europeanPaintings);
const map = europeanPaintings.map!;
const findRoute = (from: string, to: string, closures: ClosureOverride[], connections: GalleryConnection[] = map.connections) =>
  findOn(from, to, closures, { nodes: map.nodes, connections });

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

  it("routes every quest leg along the path checked on the official map (817 → 818 goes the long way round)", () => {
    for (const v of routeValidations) {
      expect(findRoute(v.fromQuestGallery, v.toQuestGallery, [])?.path, `${v.fromQuestGallery} → ${v.toQuestGallery}`).toEqual(v.path);
    }
    expect(routeValidations).toHaveLength(questOrder.length - 1);
  });

  it("puts every doorway on the wall its two rooms share", () => {
    const byId = new Map(galleryNodes.map((n) => [n.id, n]));
    const on = (n: (typeof galleryNodes)[number], x: number, y: number) =>
      x >= n.x - 0.6 && x <= n.x + n.w + 0.6 && y >= n.y - 0.6 && y <= n.y + n.h + 0.6;
    for (const c of galleryConnections) {
      expect(on(byId.get(c.from)!, c.at!.x, c.at!.y) && on(byId.get(c.to)!, c.at!.x, c.at!.y), c.id).toBe(true);
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

describe("Egyptian Art map (Floor 1)", async () => {
  const { egyptian } = await import("@/adventures/egyptian");
  const floor1 = await import("@/data/maps/met-floor1-egyptian");
  const egypt = contentFor(egyptian);
  const byId = new Map(floor1.galleryNodes.map((n) => [n.id, n]));
  const route = (a: string, b: string, closures: ClosureOverride[] = []) => findOn(a, b, closures, floor1.floor1Egyptian)?.path;

  it("has every stop, bonus and reserve gallery, and only doorways between rooms that touch", () => {
    for (const q of egypt.allQuests) expect(byId.has(q.gallery), q.gallery).toBe(true);
    const on = (n: (typeof floor1.galleryNodes)[number], x: number, y: number) =>
      x >= n.x - 0.6 && x <= n.x + n.w + 0.6 && y >= n.y - 0.6 && y <= n.y + n.h + 0.6;
    for (const c of floor1.galleryConnections) {
      expect(byId.has(c.from) && byId.has(c.to), c.id).toBe(true);
      expect(on(byId.get(c.from)!, c.at!.x, c.at!.y) && on(byId.get(c.to)!, c.at!.x, c.at!.y), c.id).toBe(true);
      if (c.verified) expect(c.source && c.verifiedAt, c.id).toBeTruthy();
    }
    expect(new Set(floor1.galleryConnections.map((c) => c.id)).size).toBe(floor1.galleryConnections.length);
  });

  it("routes every other quest leg along the path traced on the official map", () => {
    for (const v of floor1.routeValidations) {
      expect(egypt.findRoute(v.fromQuestGallery, v.toQuestGallery, [])?.path, `${v.fromQuestGallery} → ${v.toQuestGallery}`).toEqual(v.path);
    }
    expect(floor1.routeValidations).toHaveLength(egypt.questOrder.length - 2);
  });

  it("never gives directions for 117 → 122 until it is walked on site", () => {
    expect(egypt.findRoute("117", "122", [])).toBeNull();
    expect(egypt.findRoute("122", "117", [])).toBeNull();
    // On the map itself there is a walk, but a long one: 122 opens only into 121, and the
    // 119 ↔ 121 opening is unreadable (and 118–120 are closed), so it loops through the west galleries.
    const loop = ["117", "116", "115", "111", "110", "108", "107", "132", "128", "123", "121", "122"];
    expect(route("117", "122")).toEqual(loop);
    expect(route("117", "122", closed("118", "119", "120"))).toEqual(loop);
  });

  it("only reaches 122 through 121, and 126 through 125", () => {
    const touching = (g: string) => floor1.galleryConnections.filter((c) => c.from === g || c.to === g).map((c) => (c.from === g ? c.to : c.from));
    expect(touching("122")).toEqual(["121"]);
    expect(touching("126")).toEqual(["125"]);
    expect(touching("117")).toEqual(["116"]);
  });

  it("walks around closed galleries", () => {
    expect(route("116", "121", closed("118"))).not.toContain("118");
  });
});
