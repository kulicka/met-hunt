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
