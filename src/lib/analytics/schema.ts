import { z } from "zod";
import { adventures, LEGACY_ADVENTURE_ID } from "@/adventures/registry";

// The event allowlist (analytics spec, sections 4, 5 and 12), shared by the
// browser and the ingestion endpoint. Every object is strict: an unexpected
// field rejects the event. There are no free-text fields anywhere; strings are
// enums, UUIDs, or short version tokens.

export const SCHEMA_VERSION = 1;

const uuid = z.uuid();
const token = z.string().regex(/^[A-Za-z0-9._-]{1,40}$/);
const count = z.int().min(0).max(1000);
const ms = z.int().min(0).max(7 * 24 * 3600_000);
const gallery = z.int().min(100).max(999);
const questKey = z.enum([...new Set(adventures.flatMap((a) => a.versions.quests.map((q) => q.key)))] as [string, ...string[]]);
const packId = z.enum(adventures.map((a) => a.id) as [string, ...string[]]);

export const AGE_BUCKETS = ["5-7", "8-10", "11+", "unknown"] as const;
export const LATENCY_BUCKETS = ["lt2s", "2-5s", "5-10s", "10-20s", "gte20s"] as const;
export const VERIFICATION_RESULTS = ["verified", "likely", "not_found", "uncertain", "invalid_image", "error"] as const;
export const ERROR_KINDS = ["none", "offline", "timeout", "unavailable", "rate_limited", "rejected"] as const;
export const RATING_QUESTIONS = ["fun", "difficulty"] as const;
export const ERROR_CODES = ["Error", "TypeError", "RangeError", "SyntaxError", "ReferenceError", "ChunkLoadError", "QuotaExceededError", "unhandled_rejection"] as const;

const envelope = {
  event_id: uuid,
  schema_version: z.literal(SCHEMA_VERSION),
  occurred_at: z.iso.datetime(),
  adventure_id: uuid,
  session_id: uuid,
  app_version: token,
  /** Which adventure. Missing on events queued before there was a choice: those are the first adventure. */
  pack_id: packId.optional(),
  content_pack_version: token,
};

const questFields = {
  quest_id: questKey,
  gallery_id: gallery,
  artwork_id: token,
  hidden_detail_id: token,
  riddle_version: token,
  hint_set_version: token,
  artwork_assignment_version: token,
};

const plain = <N extends string, P extends z.ZodRawShape>(name: N, properties: P) =>
  z.strictObject({ ...envelope, event_name: z.literal(name), properties: z.strictObject(properties) });

const quest = <N extends string, P extends z.ZodRawShape>(name: N, properties: P) =>
  z.strictObject({ ...envelope, ...questFields, event_name: z.literal(name), properties: z.strictObject(properties) });

const routeProps = {
  from_gallery: gallery,
  to_gallery: gallery,
  route_graph_version: token,
  closure_version: token,
  closures_active: count,
};

const Events = z.discriminatedUnion("event_name", [
  plain("app_opened", { has_returning_adventure: z.boolean() }),
  // Only "granted" is ever sent: after a withdrawal nothing more leaves the phone.
  plain("analytics_consent_changed", { consent: z.enum(["granted", "withdrawn"]) }),
  plain("adventure_started", { age_bucket: z.enum(AGE_BUCKETS) }),
  plain("adventure_resumed", { from: z.enum(["reopen", "ended_early"]) }),
  plain("adventure_ended_early", {
    completed_count: count,
    current_quest_id: questKey,
    reason: z.literal("user_action"),
    elapsed_ms: ms.nullable(),
    active_ms: ms,
  }),
  plain("adventure_completed", { completed_count: count, elapsed_ms: ms.nullable(), active_ms: ms }),
  plain("adventure_restart_confirmed", {
    previous_completed_count: count,
    previous_status: z.enum(["not_started", "in_progress", "ended_early", "completed"]),
  }),
  quest("quest_viewed", { already_solved: z.boolean() }),
  // The child tapped "I'm there". navigation_ms runs from SHOW ME THE WAY to that tap:
  // a navigation interval, not a measured walk.
  quest("quest_arrival_confirmed", { via: z.enum(["map", "next_screen"]), navigation_ms: ms.nullable() }),
  quest("quest_hint_opened", { hint_level: z.union([z.literal(1), z.literal(2)]) }),
  quest("quest_photo_submitted", { attempt_number: count.min(1), source: z.enum(["camera", "library"]) }),
  quest("quest_verification_result", {
    attempt_number: count.min(1),
    result: z.enum(VERIFICATION_RESULTS),
    error_kind: z.enum(ERROR_KINDS),
    model_version: token.nullable(),
    latency_bucket: z.enum(LATENCY_BUCKETS),
  }),
  quest("quest_parent_override", {
    kind: z.enum(["after_attempts", "without_photo", "answer_key"]),
    photo_attempts: count,
  }),
  quest("quest_completed", {
    method: z.enum(["ai_verified", "text_verified", "parent_confirmed"]),
    hints_used: z.int().min(0).max(2),
    photo_attempts: count,
    active_ms: ms.nullable(),
    elapsed_ms: ms.nullable(),
    // False when the clue was first shown before timing began (e.g. consent given mid-quest).
    timing_complete: z.boolean(),
  }),
  quest("quest_skipped", { reason: z.enum(["closed", "user_switched"]) }),
  // The child's own rating, by tapping a picture: how fun the mystery was and how hard
  // the treasure was to find, 1 to 3. One event per tap; a later tap replaces an earlier one.
  quest("quest_rated", {
    question: z.enum(RATING_QUESTIONS),
    answer: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    after: z.enum(["found", "skipped"]),
  }),
  plain("route_requested", routeProps),
  plain("route_unavailable", { ...routeProps, reason: z.enum(["no_verified_route", "closure_blocking"]) }),
  plain("map_opened", { source: z.enum(["quest", "found", "menu"]) }),
  plain("app_error", { code: z.enum(ERROR_CODES), component: z.enum(["global", "verify"]) }),
]);

const keysByPack = new Map(adventures.map((a) => [a.id, new Set(a.versions.quests.map((q) => q.key))]));

/** Every event, with quest keys checked against the adventure they claim to belong to. */
export const AnalyticsEvent = Events.superRefine((e, ctx) => {
  const keys = keysByPack.get(e.pack_id ?? LEGACY_ADVENTURE_ID);
  const quest = "quest_id" in e ? e.quest_id : e.event_name === "adventure_ended_early" ? e.properties.current_quest_id : null;
  if (quest && !keys?.has(quest)) ctx.addIssue({ code: "custom", message: "quest not in this adventure", path: ["quest_id"] });
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEvent>;
export type AnalyticsEventName = AnalyticsEvent["event_name"];
export type PropsOf<N extends AnalyticsEventName> = Extract<AnalyticsEvent, { event_name: N }>["properties"];
export type QuestEventName = Extract<AnalyticsEvent, { quest_id: string }>["event_name"];

export const MAX_BATCH = 50;
export const MAX_BODY_BYTES = 64 * 1024;

export const EventBatch = z.strictObject({ events: z.array(z.unknown()).min(1).max(MAX_BATCH) });

export function ageBucket(age: number | "12+" | undefined): (typeof AGE_BUCKETS)[number] {
  if (age === undefined) return "unknown";
  if (age === "12+" || age >= 11) return "11+";
  return age >= 8 ? "8-10" : "5-7";
}

export function latencyBucket(msTaken: number): (typeof LATENCY_BUCKETS)[number] {
  if (msTaken < 2000) return "lt2s";
  if (msTaken < 5000) return "2-5s";
  if (msTaken < 10_000) return "5-10s";
  if (msTaken < 20_000) return "10-20s";
  return "gte20s";
}
