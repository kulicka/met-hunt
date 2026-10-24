import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildEgyptian, egyptian, EXPANDED_ROUTE, routeLegs } from "@/adventures/egyptian";
import { egyptianOriginalMaster, EGYPTIAN_MASTER_ID } from "@/adventures/egyptian/master";
import { reveals as egyptianReveals } from "@/adventures/egyptian/reveals";
import { europeanPaintings } from "@/adventures/european-paintings";
import { adventures, LEGACY_ADVENTURE_ID } from "@/adventures/registry";
import { serverAdventures, verificationTarget } from "@/adventures/registry.server";
import { begin, freshAdventure, parseAdventure, solve, solveBonus } from "@/lib/adventure";
import { changes } from "@/lib/analytics/derive";
import { fingerprint } from "@/lib/analytics/fingerprint";
import { AnalyticsEvent } from "@/lib/analytics/schema";
import { certificateText } from "@/lib/certificate";
import { contentFor } from "@/lib/content";

const stopsOf = (a: (typeof adventures)[number]) => [...a.quests, ...(a.bonus ?? []), ...(a.otherQuests ?? [])];

describe("adventure registry", () => {
  it("has unique, storage-safe ids and globally unique content pack versions", () => {
    const ids = adventures.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]{1,40}$/);
    const versions = adventures.map((a) => a.versions.contentPackVersion);
    expect(new Set(versions).size).toBe(versions.length);
    expect(LEGACY_ADVENTURE_ID).toBe("european-paintings");
    expect(adventures[0].legacyProgressKeys).toContain("met-hidden-treasures:adventure:v2");
    expect(adventures.filter((a) => a.legacyProgressKeys?.length)).toHaveLength(1);
  });

  for (const a of adventures) {
    describe(a.title, () => {
      const stops = stopsOf(a);

      it("has unique quest ids and a version row (with stable key) for every stop", () => {
        const ids = stops.map((q) => q.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(a.versions.quests.map((v) => v.questId).sort()).toEqual([...ids].sort());
        const keys = a.versions.quests.map((v) => v.key);
        expect(new Set(keys).size).toBe(keys.length);
        for (const k of keys) expect(k).toMatch(/^[A-Za-z0-9._-]{1,40}$/);
        for (const v of a.versions.quests) expect(String(v.galleryId)).toBe(stops.find((q) => q.id === v.questId)!.gallery);
      });

      it("fails if a riddle or hint changes without a new version and fingerprint", () => {
        for (const v of a.versions.quests) {
          const q = stops.find((x) => x.id === v.questId)!;
          expect(fingerprint(q.riddle.join("\n")), `riddle ${v.key} changed: bump riddleVersion`).toBe(v.riddleFingerprint);
          expect(fingerprint(q.hints.join("\n")), `hints ${v.key} changed: bump hintSetVersion`).toBe(v.hintsFingerprint);
        }
      });

      it("has an answer, a stamp, and a server-side verification target for every stop", async () => {
        const reveals = await a.loadReveals();
        const { default: Stamp } = await a.loadStamps();
        expect(typeof Stamp).toBe("function");
        for (const q of stops) {
          expect(reveals.find((r) => r.id === q.id), `reveal ${q.id}`).toBeTruthy();
          expect(verificationTarget(a.id, q.id), `target ${q.id}`).toBeTruthy();
        }
        expect(serverAdventures.find((s) => s.adventure.id === a.id)).toBeTruthy();
      });

      it("only puts quests in galleries its map knows", () => {
        if (!a.map) return;
        const rooms = new Set(a.map.nodes.map((n) => n.id));
        for (const q of a.quests) expect(rooms.has(q.gallery), q.gallery).toBe(true);
      });

      it("uses its chapters to cover the lineup exactly, in order", () => {
        if (!a.chapters) return;
        expect(a.chapters.flatMap((c) => c.questIds)).toEqual(a.quests.map((q) => q.id));
      });
    });
  }

  it("old verify requests without an adventure go to the first one", () => {
    expect(verificationTarget(null, 1)?.artwork).toBe("Young Lady in 1866");
    expect(verificationTarget("met-egyptian-adventure", 1)).toBeUndefined();
    expect(verificationTarget("nope", 1)).toBeUndefined();
  });
});

describe("Egyptian Adventure (spec v1.0 draft)", () => {
  const c = contentFor(egyptian);

  it("stays field-test-only, with a map but no directions for 117 → 122", () => {
    expect(egyptian.id).toBe("met-egyptian-adventure");
    expect(egyptian.launchStatus).toBe("field_test_required");
    expect(egyptian.map?.id).toBe("met-floor1-egyptian");
    expect(c.hasRoutes).toBe(true);
    expect(c.findRoute("117", "122", [])).toBeNull();
    expect(c.findRoute("111", "112", [])?.path).toEqual(["111", "112"]);
    expect(routeLegs.every((l) => !l.routeVerified)).toBe(true);
    expect(routeLegs.find((l) => l.from === "117" && l.to === "122")).toMatchObject({ routeVerified: false });
  });

  it("plays ten required stops in two chapters of 6 + 4, plus one bonus and one reserve", () => {
    expect(c.questOrder).toEqual(["111", "112", "114", "115", "116", "117", "122", "123", "124", "125"]);
    expect(egyptian.chapters!.map((ch) => [ch.title, ch.questIds.length])).toEqual([
      ["Royal Treasures", 6],
      ["Secrets of the Pharaohs", 4],
    ]);
    expect(egyptian.bonus!.map((b) => [b.id, b.gallery, b.atQuest])).toEqual([[1171, "117", 117]]);
    // The four Daily Life stops wait with the reserve until checked on site.
    expect(egyptian.otherQuests!.map((q) => q.gallery)).toEqual(["105", "107", "108", "110", "126"]);
    expect(c.questById(126)).toBeUndefined(); // reserve: not playable until swapped in
    expect(c.questById(105)).toBeUndefined();
  });

  it("never plays closed Galleries 118–120 or the unconfirmed 113 baboon", () => {
    for (const q of stopsOf(egyptian)) expect(["113", "118", "119", "120"]).not.toContain(q.gallery);
  });

  it("keeps the locked riddle text exactly", () => {
    expect(c.questById(111)!.riddle).toHaveLength(4);
    expect(c.questById(124)!.riddle[1]).toBe("But I’m as still as still can be."); // curly apostrophe
    expect(c.questById(117)!.riddle[0]).toBe("I'm not a pet, I never roam,"); // straight apostrophe
    for (const q of egyptian.quests.filter((q) => q.id !== 111)) expect(q.riddle).toHaveLength(2);
  });

  it("keeps the original master collection unchanged and separate", () => {
    expect(EGYPTIAN_MASTER_ID).toBe("met-egyptian-original-master-v1");
    expect(egyptianOriginalMaster.map((m) => m.gallery)).toEqual(["111", "112", "113", "114", "115", "116", "117", "118", "119", "120", "117"]);
    expect(fingerprint(JSON.stringify(egyptianOriginalMaster)), "the master archive must never change").toBe("2d6ee640");
    // The launch edition agrees with the master wherever they share a stop.
    for (const m of egyptianOriginalMaster) {
      const launch = [...egyptian.quests, ...egyptian.bonus!].find((q) => q.gallery === m.gallery && q.title === m.title);
      if (launch) expect(launch.riddle, m.title).toEqual(m.riddle);
    }
    expect(egyptianOriginalMaster.find((m) => m.gallery === "113")!.metObjectId).toBeNull();
  });

  it("links every answer to its Met object", () => {
    for (const r of egyptianReveals) expect(r.metObjectUrl).toBe(`https://www.metmuseum.org/art/collection/search/${r.metObjectId}`);
  });

  it("completes on the ten required finds; the bonus is a star, never a requirement", () => {
    const ids = c.questIds;
    let a = begin(freshAdventure(ids[0]));
    a = solveBonus(a, 1171, "ai-photo");
    expect(a).toMatchObject({ status: "in_progress", currentQuest: 111, completedQuests: [], bonusFound: [1171] });
    expect(solveBonus(a, 1171, "manual")).toBe(a); // no double award
    for (const id of ids.slice(0, -1)) a = solve(a, id, "ai-photo", null, ids);
    expect(a.status).toBe("in_progress");
    a = solve(a, ids.at(-1)!, "grown-up", null, ids);
    expect(a.status).toBe("completed");
    const cert = certificateText(a, ids.length, "Cleo", egyptian.certificate);
    expect(cert).toMatchObject({ kind: "full", countLine: "10/10 treasures discovered" });
  });

  it("reports a bonus find as a quest completion with its own stable key", () => {
    const started = begin(freshAdventure(111));
    expect(changes(started, solveBonus(started, 1171, "manual"))).toEqual([
      { type: "quest_completed", questId: 1171, method: "parent_confirmed", hintsUsed: 0 },
    ]);
    expect(c.versionOf(1171)?.key).toBe("egy-117-bonus-heart");
  });

  it("keeps saved finds when a stop leaves the lineup, and brings them back when it returns", () => {
    const saved = { status: "in_progress", currentQuest: 125, completedQuests: [111, 125], bonusFound: [1171] };
    // Curator swaps Gallery 125 for reserve 126: a nine-of-ten hunt plus 126.
    const swapped = [111, 112, 114, 115, 116, 117, 122, 123, 124, 126];
    const a = parseAdventure(saved, swapped, { bonus: [1171], other: [125] });
    expect(a).toMatchObject({ completedQuests: [111], retiredFinds: [125], bonusFound: [1171], currentQuest: 111 });
    const back = parseAdventure(a, c.questIds, c.extraIds);
    expect(back.completedQuests).toEqual([111, 125]);
    expect(back.retiredFinds).toBeUndefined();
  });

  it("recalculates completion for a shortened adventure", () => {
    const short = [111, 112, 114];
    expect(parseAdventure({ status: "in_progress", completedQuests: [111, 112, 114, 115] }, short, { other: [115] }).status).toBe("completed");
  });
});

describe("Egyptian Daily Life stops (four new quests spec, 2026-10-24)", () => {
  const { adventure: expanded, routeLegs: expandedLegs } = buildEgyptian(true);
  const c = contentFor(expanded);
  const NEW = [105, 107, 108, 110];

  it("stays off in the live hunt until checked on site", () => {
    expect(EXPANDED_ROUTE).toBe(false);
    expect(egyptian.quests).toHaveLength(10);
    expect(egyptian.where).toBe("Floor 1 · Egyptian Art, Galleries 111–125");
    expect(egyptian.description).toContain("collect ten discoveries!");
  });

  it("adds them first, in gallery order, as their own chapter, leaving the rest as it was", () => {
    expect(c.questOrder).toEqual(["105", "107", "108", "110", "111", "112", "114", "115", "116", "117", "122", "123", "124", "125"]);
    expect(expanded.chapters!.map((ch) => [ch.id, ch.questIds.length])).toEqual([
      ["daily-life", 4],
      ["royal-treasures", 6],
      ["pharaoh-secrets", 4],
    ]);
    expect(expanded.quests.slice(4)).toEqual(egyptian.quests);
    expect(expanded.bonus).toEqual(egyptian.bonus);
    expect(expanded.otherQuests!.map((q) => q.gallery)).toEqual(["126"]);
    expect(expanded.where).toBe("Floor 1 · Egyptian Art, Galleries 105–125");
    expect(expanded.description).toContain("collect fourteen discoveries!");
  });

  it("shows the approved riddles exactly, two lines each", () => {
    expect(NEW.map((id) => c.questById(id)!.riddle)).toEqual([
      ["My hands are white, but there's no snow,", "I'm making something you all know!"],
      ["No carts, no stores, no checkout line,", "I counted grain in ancient time!"],
      ["We have four hooves, but here's the twist,", "We're walking where the fish exist!"],
      ["I'm just a child from long ago,", "One special braid I have to show!"],
    ]);
    expect(NEW.map((id) => c.questById(id)!.hints[0])).toEqual([
      "Look for someone preparing food.",
      "Find a message written on papyrus.",
      "Look carefully at a carved scene with animals.",
      "Look at the child's hairstyle.",
    ]);
  });

  it("links each to the Met object, gallery and hidden detail in the spec", async () => {
    const reveals = await expanded.loadReveals();
    const want = { 105: [544258, "White flour"], 107: [545452, "grain"], 108: [546098, "Cattle"], 110: [329884, "side braid"] } as const;
    for (const id of NEW) {
      const r = reveals.find((x) => x.id === id)!;
      expect(r.metObjectId).toBe(want[id as keyof typeof want][0]);
      expect(r.hiddenObject).toContain(want[id as keyof typeof want][1]);
      expect(c.versionOf(id)).toMatchObject({ key: `egy-${id}`, galleryId: id, riddleVersion: "r1" });
    }
  });

  it("gives no directions for the new walks until they are walked", () => {
    for (const [from, to] of [["105", "107"], ["107", "108"], ["108", "110"], ["110", "111"], ["117", "122"]]) {
      expect(c.findRoute(from, to, []), `${from} → ${to}`).toBeNull();
    }
    // Each is a single doorway on The Met's map, so directions come back once released.
    expect(contentFor({ ...expanded, heldRoutes: [] }).findRoute("108", "110", [])?.path).toEqual(["108", "110"]);
    expect(expandedLegs.slice(0, 4).every((l) => !l.routeVerified)).toBe(true);
  });

  it("completes on all fourteen, and keeps finds made before the switch either way", () => {
    const ids = c.questIds;
    let a = begin(freshAdventure(ids[0]));
    for (const id of ids) a = solve(a, id, "ai-photo", null, ids);
    expect(a.status).toBe("completed");
    expect(certificateText(a, ids.length, "Cleo", expanded.certificate)).toMatchObject({ kind: "full", countLine: "14/14 treasures discovered" });

    const live = contentFor(egyptian);
    const saved = { status: "in_progress", currentQuest: 112, completedQuests: [111], bonusFound: [1171] };
    const grown = parseAdventure(saved, c.questIds, c.extraIds);
    expect(grown).toMatchObject({ status: "in_progress", completedQuests: [111], bonusFound: [1171] });
    const shrunk = parseAdventure({ ...grown, completedQuests: [105, 111] }, live.questIds, live.extraIds);
    expect(shrunk).toMatchObject({ completedQuests: [111], retiredFinds: [105] });
  });
});

describe("analytics across adventures", () => {
  const base = {
    event_id: "00000000-0000-4000-8000-000000000001",
    schema_version: 1,
    occurred_at: "2026-10-23T12:00:00.000Z",
    adventure_id: "11111111-1111-4111-8111-111111111111",
    session_id: "22222222-2222-4222-8222-222222222222",
    app_version: "0.1.0",
    content_pack_version: "1.1.0-draft",
  };
  const quest = (packId: string | undefined, key: string, gallery: number) => ({
    ...base,
    ...(packId ? { pack_id: packId } : {}),
    event_name: "quest_viewed",
    quest_id: key,
    gallery_id: gallery,
    artwork_id: "art-111",
    hidden_detail_id: "detail-111",
    riddle_version: "r1",
    hint_set_version: "h1",
    artwork_assignment_version: "a1",
    properties: { already_solved: false },
  });

  it("accepts a quest key only in its own adventure", () => {
    expect(AnalyticsEvent.safeParse(quest("met-egyptian-adventure", "egy-111", 111)).success).toBe(true);
    expect(AnalyticsEvent.safeParse(quest("met-egyptian-adventure", "q01", 810)).success).toBe(false);
    expect(AnalyticsEvent.safeParse(quest("european-paintings", "egy-111", 111)).success).toBe(false);
    // Queued before there was a choice: no pack_id means the first adventure.
    expect(AnalyticsEvent.safeParse(quest(undefined, "q01", 810)).success).toBe(true);
    expect(AnalyticsEvent.safeParse(quest(undefined, "egy-111", 111)).success).toBe(false);
    expect(AnalyticsEvent.safeParse(quest("somewhere-else", "q01", 810)).success).toBe(false);
  });
});

describe("progress store", () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    const localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    (globalThis as { window?: unknown }).window = { localStorage };
  });
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  const fresh = async () => {
    // Each test gets fresh module state, as on a new page load.
    const { vi } = await import("vitest");
    vi.resetModules();
    return { progress: await import("@/lib/progress"), profile: await import("@/lib/profile") };
  };

  it("keeps a hunt saved before adventures existed in European Paintings, losing nothing", async () => {
    const old = { status: "in_progress", currentQuest: 3, completedQuests: [1, 2], hintsUsed: { 3: 1 }, attempts: {}, verificationMethod: { 1: "ai-photo", 2: "manual" } };
    store.set("met-hidden-treasures:adventure:v2", JSON.stringify(old));
    store.set("met-hidden-treasures:profile:v1", JSON.stringify({ age: 8, avatarId: "fig", onboardingComplete: true }));
    const { progress, profile } = await fresh();
    // They still choose; their old hunt shows up on the European Paintings card.
    expect(profile.getProfile()).toMatchObject({ adventureId: undefined, onboardingComplete: true });
    expect(progress.getProgressFor("european-paintings")).toMatchObject({ status: "in_progress", currentQuest: 3, completedQuests: [1, 2], hintsUsed: { 3: 1 } });
    profile.setAdventure("european-paintings");
    expect(progress.getProgress()).toMatchObject({ status: "in_progress", currentQuest: 3, completedQuests: [1, 2], hintsUsed: { 3: 1 } });
    expect(JSON.parse(store.get(progress.progressKey("european-paintings"))!)).toMatchObject({ completedQuests: [1, 2] });
    expect(store.has("met-hidden-treasures:adventure:v2")).toBe(true); // the old record is left alone
  });

  it("keeps each adventure's progress separate when switching", async () => {
    store.set("met-hidden-treasures:profile:v1", JSON.stringify({ age: 8, avatarId: "fig", adventureId: "european-paintings", onboardingComplete: true }));
    const { progress, profile } = await fresh();
    progress.completeQuest(1, "ai-photo", 2);
    profile.setAdventure("met-egyptian-adventure");
    expect(progress.getProgress()).toMatchObject({ status: "not_started", currentQuest: 111, completedQuests: [] });
    progress.completeQuest(111, "grown-up", 112);
    progress.completeQuest(1171, "ai-photo", null);
    expect(progress.getProgress()).toMatchObject({ completedQuests: [111], bonusFound: [1171], currentQuest: 112 });
    profile.setAdventure("european-paintings");
    expect(progress.getProgress()).toMatchObject({ completedQuests: [1], currentQuest: 2 });
    progress.restartAdventure();
    expect(progress.getProgressFor("met-egyptian-adventure")).toMatchObject({ completedQuests: [111] });
  });

  it("sends a player whose adventure was removed back to the picker, keeping their explorer", async () => {
    store.set("met-hidden-treasures:profile:v1", JSON.stringify({ age: 8, avatarId: "fig", adventureId: "gone", onboardingComplete: true }));
    const { profile } = await fresh();
    expect(profile.getProfile()).toMatchObject({ avatarId: "fig", adventureId: undefined, onboardingComplete: true });
  });
});

it("gives European Paintings the same certificate titles as before", () => {
  expect(europeanPaintings.certificate).toEqual({ fullTitle: "LEGENDARY ART DETECTIVE", partialTitle: "EXPLORER OF HIDDEN TREASURES" });
});
