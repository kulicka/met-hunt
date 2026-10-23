import { describe, expect, it } from "vitest";
import { hiddenTreasuresPack } from "@/data/hidden-treasures/pack";
import { quests } from "@/data/hidden-treasures/quests";
import { questVersions } from "@/data/hidden-treasures/versions";
import { begin, endEarly, freshAdventure, restart, solve } from "@/lib/adventure";
import { activity, IDLE_MS, setVisible, startClock, tick } from "@/lib/analytics/clock";
import { changes } from "@/lib/analytics/derive";
import { fingerprint } from "@/lib/analytics/fingerprint";
import { acknowledge, enqueue, parseQueue, QUEUE_MAX_AGE_MS, QUEUE_MAX_EVENTS } from "@/lib/analytics/queue";
import { ageBucket, AnalyticsEvent, latencyBucket } from "@/lib/analytics/schema";

const ids = hiddenTreasuresPack.questIds;
const NOW = Date.parse("2026-10-23T12:00:00Z");

let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

export function event(overrides: Record<string, unknown> = {}, at = NOW) {
  return {
    event_id: uuid(),
    schema_version: 1,
    occurred_at: new Date(at).toISOString(),
    adventure_id: "11111111-1111-4111-8111-111111111111",
    session_id: "22222222-2222-4222-8222-222222222222",
    app_version: "0.1.0",
    content_pack_version: "2026.10.22-1",
    event_name: "app_opened",
    properties: { has_returning_adventure: false },
    ...overrides,
  };
}

const questEvent = (name: string, properties: Record<string, unknown>, at = NOW) =>
  event(
    {
      event_name: name,
      quest_id: "q03",
      gallery_id: 816,
      artwork_id: "art-03",
      hidden_detail_id: "detail-03",
      riddle_version: "r1",
      hint_set_version: "h1",
      artwork_assignment_version: "a1",
      properties,
    },
    at,
  );

describe("content versions", () => {
  it("covers every quest once, with matching galleries and unique stable keys", () => {
    expect(questVersions.map((v) => v.questId)).toEqual(ids);
    expect(new Set(questVersions.map((v) => v.key)).size).toBe(ids.length);
    for (const v of questVersions) expect(String(v.galleryId)).toBe(quests.find((q) => q.id === v.questId)!.gallery);
  });

  it("fails if a riddle or hint changes without a new version and fingerprint", () => {
    for (const v of questVersions) {
      const q = quests.find((x) => x.id === v.questId)!;
      expect(fingerprint(q.riddle.join("\n")), `riddle ${v.key} changed: bump riddleVersion`).toBe(v.riddleFingerprint);
      expect(fingerprint(q.hints.join("\n")), `hints ${v.key} changed: bump hintSetVersion`).toBe(v.hintsFingerprint);
    }
  });

  it("uses opaque artwork ids that don't give the answer away", () => {
    for (const v of questVersions) expect(v.artworkId).toMatch(/^art-\d{2}$/);
  });
});

describe("event allowlist", () => {
  it("accepts well-formed events", () => {
    expect(AnalyticsEvent.safeParse(event()).success).toBe(true);
    expect(AnalyticsEvent.safeParse(questEvent("quest_hint_opened", { hint_level: 2 })).success).toBe(true);
    expect(
      AnalyticsEvent.safeParse(
        questEvent("quest_verification_result", { attempt_number: 1, result: "uncertain", error_kind: "none", model_version: "claude-opus-5-5", latency_bucket: "5-10s" }),
      ).success,
    ).toBe(true);
  });

  it("rejects unexpected fields, free text, and identifiers", () => {
    const bad = [
      event({ name: "Sam" }),
      event({ properties: { has_returning_adventure: false, note: "hi" } }),
      event({ event_name: "adventure_started", properties: { age_bucket: "9" } }),
      event({ event_name: "photo_uploaded" }),
      event({ adventure_id: "kid-123" }),
      event({ app_version: "1.0 <script>" }),
      questEvent("quest_hint_opened", { hint_level: 3 }),
      questEvent("quest_viewed", { already_solved: false, avatar: "fig" }),
      { ...questEvent("quest_viewed", { already_solved: false }), quest_id: "Young Lady in 1866" },
      questEvent("quest_photo_submitted", { attempt_number: 1, source: "camera", image: "data:image/jpeg;base64,..." }),
      // quest fields on an adventure-level event
      { ...event(), quest_id: "q01" },
    ];
    for (const b of bad) expect(AnalyticsEvent.safeParse(b).success, JSON.stringify(b).slice(0, 120)).toBe(false);
  });

  it("groups ages into broad buckets", () => {
    expect([5, 7, 8, 10, 11, "12+" as const, undefined].map((a) => ageBucket(a))).toEqual(["5-7", "5-7", "8-10", "8-10", "11+", "11+", "unknown"]);
  });

  it("buckets latency", () => {
    expect([100, 2000, 9999, 15_000, 40_000].map(latencyBucket)).toEqual(["lt2s", "2-5s", "5-10s", "10-20s", "gte20s"]);
  });
});

describe("local queue", () => {
  it("drops a corrupt or partly corrupt queue without crashing", () => {
    expect(parseQueue("garbage", NOW)).toEqual([]);
    expect(parseQueue(null, NOW)).toEqual([]);
    const good = event();
    expect(parseQueue([good, { nope: 1 }, 42], NOW)).toEqual([good]);
  });

  it("caps size and age", () => {
    let q = [event({}, NOW - QUEUE_MAX_AGE_MS - 1) as AnalyticsEvent];
    q = enqueue(q, event() as AnalyticsEvent, NOW);
    expect(q).toHaveLength(1);
    for (let i = 0; i < QUEUE_MAX_EVENTS + 20; i++) q = enqueue(q, event() as AnalyticsEvent, NOW);
    expect(q).toHaveLength(QUEUE_MAX_EVENTS);
  });

  it("removes acknowledged events only", () => {
    const a = event() as AnalyticsEvent;
    const b = event() as AnalyticsEvent;
    expect(acknowledge([a, b], new Set([a.event_id]))).toEqual([b]);
  });
});

describe("active time", () => {
  it("counts visible time and stops counting after the idle threshold", () => {
    let c = startClock(0);
    c = tick(c, 30_000);
    expect(c.activeMs).toBe(30_000);
    c = tick(c, 10 * 60_000); // no touches for 10 minutes
    expect(c.activeMs).toBe(IDLE_MS);
    c = activity(c, 10 * 60_000);
    c = tick(c, 10 * 60_000 + 5000);
    expect(c.activeMs).toBe(IDLE_MS + 5000);
  });

  it("excludes background time", () => {
    let c = startClock(0);
    c = setVisible(c, false, 10_000);
    c = tick(c, 70_000);
    c = setVisible(c, true, 3_600_000);
    c = tick(c, 3_600_000 + 20_000);
    expect(c.activeMs).toBe(30_000);
  });
});

describe("events derived from the adventure", () => {
  const started = begin(freshAdventure(1));

  it("start, hints, completion, end early, resume, finish", () => {
    expect(changes(freshAdventure(1), started)).toEqual([{ type: "adventure_started" }]);

    const hinted = { ...started, hintsUsed: { 1: 2 } };
    expect(changes(started, hinted)).toEqual([
      { type: "quest_hint_opened", questId: 1, level: 1 },
      { type: "quest_hint_opened", questId: 1, level: 2 },
    ]);

    const solved = solve(hinted, 1, "ai-photo", 2, ids);
    expect(changes(hinted, solved)).toEqual([{ type: "quest_completed", questId: 1, method: "ai_verified", hintsUsed: 2 }]);

    const ended = endEarly(solved);
    expect(changes(solved, ended)).toEqual([{ type: "adventure_ended_early" }]);
    expect(changes(ended, begin(ended))).toEqual([{ type: "adventure_resumed" }]);
  });

  it("keeps parent confirmation distinct from AI verification", () => {
    expect(changes(started, solve(started, 1, "grown-up", 2, ids))[0]).toMatchObject({ method: "parent_confirmed" });
    expect(changes(started, solve(started, 1, "manual", 2, ids))[0]).toMatchObject({ method: "parent_confirmed" });
  });

  it("reports the whole hunt completing after the last quest", () => {
    let a = started;
    for (const id of ids.slice(0, -1)) a = solve(a, id, "ai-photo", null, ids);
    const done = solve(a, ids.at(-1)!, "ai-photo", null, ids);
    expect(changes(a, done).map((c) => c.type)).toEqual(["quest_completed", "adventure_completed"]);
  });

  it("emits nothing for a restart itself (the dialog records it on confirm only)", () => {
    expect(changes(solve(started, 1, "ai-photo", 2, ids), restart(1))).toEqual([]);
  });
});
