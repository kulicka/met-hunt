import { describe, expect, it } from "vitest";
import { avatars } from "@/data/avatars";
import { hiddenTreasuresPack } from "@/data/hidden-treasures/pack";
import { begin, endEarly, freshAdventure, parseAdventure, parseProfile, restart, solve } from "@/lib/adventure";

const ids = hiddenTreasuresPack.questIds;
const avatarIds = avatars.map((a) => a.id);

describe("player profile", () => {
  it("has a fixed roster with names and descriptions, and no name field", () => {
    expect(avatars.length).toBeGreaterThanOrEqual(6);
    expect(avatars.length).toBeLessThanOrEqual(8);
    for (const a of avatars) expect(a.displayName && a.description && a.imageAsset).toBeTruthy();
    expect(Object.keys(parseProfile({ age: 8, avatarId: "fig", onboardingComplete: true, name: "Sam" }, avatarIds))).not.toContain("name");
  });

  it("accepts valid choices and keeps 12+ as a category", () => {
    expect(parseProfile({ age: "12+", avatarId: "otto", onboardingComplete: true }, avatarIds)).toEqual({ age: "12+", avatarId: "otto", onboardingComplete: true });
  });

  it("recovers from missing, corrupt, or partial records", () => {
    for (const raw of [null, "x", 42, [], { age: 99, avatarId: "pikachu", onboardingComplete: true }]) {
      expect(parseProfile(raw, avatarIds).onboardingComplete).toBe(false);
    }
    // interrupted after the age step
    expect(parseProfile({ age: 7, onboardingComplete: false }, avatarIds)).toEqual({ age: 7, avatarId: undefined, onboardingComplete: false });
  });
});

describe("adventure state", () => {
  it("starts at quest 1 / Gallery 810 with nothing found", () => {
    const a = begin(freshAdventure(ids[0]));
    expect(a).toMatchObject({ status: "in_progress", currentQuest: 1, completedQuests: [] });
    expect(a.startedAt).toBeTruthy();
  });

  it("ends early keeping everything, and can be resumed", () => {
    let a = solve(begin(freshAdventure(1)), 1, "ai-photo", 2, ids);
    a = { ...a, hintsUsed: { 2: 1 }, attempts: { 2: 3 } };
    const ended = endEarly(a);
    expect(ended).toMatchObject({ status: "ended_early", currentQuest: 2, completedQuests: [1], hintsUsed: { 2: 1 }, attempts: { 2: 3 }, verificationMethod: { 1: "ai-photo" } });
    expect(ended.endedAt).toBeTruthy();
    const resumed = begin(ended);
    expect(resumed).toMatchObject({ status: "in_progress", currentQuest: 2, completedQuests: [1], startedAt: a.startedAt });
    expect(resumed.endedAt).toBeUndefined();
  });

  it("only ends early from in_progress", () => {
    const fresh = freshAdventure(1);
    expect(endEarly(fresh)).toBe(fresh);
  });

  it("completes only when all ten are solved", () => {
    let a = begin(freshAdventure(1));
    ids.forEach((id, i) => {
      a = solve(a, id, "grown-up", ids[i + 1] ?? null, ids);
      expect(a.status).toBe(i === ids.length - 1 ? "completed" : "in_progress");
    });
    expect(a.completedAt).toBeTruthy();
  });

  it("finding a treasure after ending early resumes the adventure", () => {
    const ended = endEarly(begin(freshAdventure(1)));
    expect(solve(ended, 1, "ai-photo", 2, ids).status).toBe("in_progress");
  });

  it("restart clears hunt progress and timestamps", () => {
    expect(restart(1)).toEqual({ status: "not_started", currentQuest: 1, completedQuests: [], hintsUsed: {}, attempts: {}, verificationMethod: {} });
  });

  it("migrates progress saved before this feature", () => {
    const old = { gameStarted: true, currentQuest: 3, completedQuests: [1, 2], hintsUsed: { 3: 1 }, attempts: {}, verificationMethod: { 1: "ai-photo", 2: "manual" } };
    expect(parseAdventure(old, ids)).toMatchObject({ status: "in_progress", currentQuest: 3, completedQuests: [1, 2], verificationMethod: { 1: "ai-photo", 2: "manual" } });
    expect(parseAdventure({ gameStarted: false }, ids).status).toBe("not_started");
  });

  it("drops malformed fields instead of failing", () => {
    const a = parseAdventure(
      { status: "bogus", currentQuest: 77, completedQuests: [1, 1, "2", 99], hintsUsed: { 1: -1, 2: 1, 50: 1 }, attempts: "x", verificationMethod: { 1: "magic" }, startedAt: "not a date" },
      ids,
    );
    expect(a).toEqual({ status: "in_progress", currentQuest: 1, completedQuests: [1], hintsUsed: { 2: 1 }, attempts: {}, verificationMethod: {}, startedAt: undefined, endedAt: undefined, completedAt: undefined });
    for (const raw of [null, "oops", 5, []]) expect(parseAdventure(raw, ids)).toEqual(freshAdventure(1));
  });

  it("keeps status consistent with what was found", () => {
    expect(parseAdventure({ status: "completed", completedQuests: [1] }, ids).status).toBe("in_progress");
    expect(parseAdventure({ status: "ended_early", completedQuests: ids }, ids).status).toBe("completed");
  });
});

describe("certificate wording", async () => {
  const { certificateText } = await import("@/lib/certificate");
  const base = { completedQuests: [] as number[] };

  it("gives the top title only for all ten", () => {
    const full = certificateText({ status: "completed", completedQuests: ids, completedAt: "2026-10-22T20:00:00Z" }, 10, "Fig");
    expect(full).toMatchObject({ kind: "full", title: "LEGENDARY ART DETECTIVE", countLine: "10/10 treasures discovered", date: "2026-10-22T20:00:00Z" });
    expect(full.statement).toBe("This certifies that Fig discovered all 10 hidden treasures at The Met.");
    const nine = certificateText({ status: "ended_early", completedQuests: ids.slice(0, 9) }, 10, "Fig");
    expect(nine.kind).toBe("explorer");
    expect(nine.title).not.toMatch(/LEGENDARY/);
  });

  it("uses truthful partial wording, including zero", () => {
    expect(certificateText({ ...base, status: "ended_early", completedQuests: [1, 2, 3, 4, 5, 6] }, 10, "Otto").statement).toBe(
      "Otto discovered 6 hidden treasures during a museum adventure.",
    );
    expect(certificateText({ ...base, status: "ended_early", completedQuests: [1] }, 10, "Otto").statement).toContain("1 hidden treasure during");
    const zero = certificateText({ ...base, status: "ended_early" }, 10, "Pip");
    expect(zero.statement).toBe("Pip began a museum adventure.");
    expect(zero.countLine).toBeUndefined();
    expect(certificateText({ ...base, status: "in_progress", completedQuests: [1, 2] }, 10, "Pip").statement).toContain("so far");
  });
});

describe("hint counts", () => {
  it("are clamped to 0, 1 or 2", () => {
    expect(parseAdventure({ hintsUsed: { 1: 3, 2: 2, 3: 1.5, 4: 0 } }, ids).hintsUsed).toEqual({ 2: 2, 4: 0 });
  });
});
