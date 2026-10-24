"use client";

import { useEffect, useSyncExternalStore } from "react";
import { adventureIds, LEGACY_ADVENTURE_ID } from "@/adventures/registry";
import type { AdventureState } from "@/lib/adventure";
import { activeAdventure, contentFor, resolveAdventure, type AdventureContent } from "@/lib/content";
import { getProfile } from "@/lib/profile";
import { getProgress, observeProgress } from "@/lib/progress";
import { activity, setVisible, startClock, tick, type ClockState } from "./clock";
import { changes } from "./derive";
import { acknowledge, enqueue, parseQueue } from "./queue";
import {
  ageBucket,
  ERROR_CODES,
  MAX_BATCH,
  SCHEMA_VERSION,
  type AnalyticsEvent,
  type AnalyticsEventName,
  type PropsOf,
  type QuestEventName,
} from "./schema";

// First-party, consent-only analytics (analytics spec, sections 3, 4 and 11).
//
// - Nothing is recorded or sent until a grown-up turns it on in the grown-ups
//   area, and only when the server says analytics is enabled.
// - Turning it off deletes the local queue and timers at once; nothing more is sent.
// - Events carry a random adventure id (new for every new play-through) and a random
//   visit id, plus which adventure pack is being played (pack_id). Never a name,
//   the explorer, a photo, free text, or a location.
// - Timers and play-through ids are kept per adventure pack, like progress.

const CONSENT_KEY = "met-hidden-treasures:analytics-consent:v1";
const ENABLED_KEY = "met-hidden-treasures:analytics-enabled:v1";
/** Before adventures were pluggable: one record, for the first adventure. */
const LEGACY_STATE_KEY = "met-hidden-treasures:analytics:v1";
const stateKey = (packId: string) => `met-hidden-treasures:analytics:v2:${packId}`;
const QUEUE_KEY = "met-hidden-treasures:analytics-queue:v1";
const SESSION_KEY = "met-hidden-treasures:analytics-session:v1";
/** Bump when the grown-up notice changes in a way that needs asking again. */
export const NOTICE_VERSION = 1;

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
const FLUSH_DELAY_MS = 4000;
const FLUSH_EVERY_MS = 30_000;
const MAX_ERRORS_PER_VISIT = 5;

export interface Consent {
  status: "granted" | "declined";
  decidedAt: string;
  noticeVersion: number;
}

interface QuestMark {
  startActive: number;
  startWall: number;
  photos: number;
  complete: boolean;
}

interface State {
  adventureId: string;
  activeMs: number;
  quests: Record<number, QuestMark>;
}

// ---------- storage helpers ----------

function read<T>(key: string, storage: () => Storage = () => localStorage): T | null {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown, storage: () => Storage = () => localStorage) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: analytics simply does less.
  }
}

export function randomId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// ---------- consent store ----------

let consent: Consent | null | undefined; // undefined = not read yet
interface ServerSettings {
  enabled: boolean;
  retentionDays: number;
}
let server: ServerSettings | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function parseConsent(raw: unknown): Consent | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<Consent>;
  if ((c.status !== "granted" && c.status !== "declined") || typeof c.decidedAt !== "string") return null;
  // A consent given under an older notice doesn't count.
  if (c.noticeVersion !== NOTICE_VERSION) return null;
  return c as Consent;
}

const getConsent = () => {
  if (consent === undefined) consent = parseConsent(read(CONSENT_KEY));
  return consent;
};

const OFF: ServerSettings = { enabled: false, retentionDays: 0 };

const getServer = () => {
  if (server === undefined) {
    const raw = read<ServerSettings>(ENABLED_KEY);
    server = raw?.enabled === true && typeof raw.retentionDays === "number" ? raw : OFF;
  }
  return server;
};
const getEnabled = () => getServer().enabled;

const granted = () => typeof window !== "undefined" && getEnabled() && getConsent()?.status === "granted";

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** The grown-up's choice on this phone; null until they make one (analytics stays off). */
export function useAnalyticsConsent() {
  return useSyncExternalStore(subscribe, getConsent, () => null);
}

/** Whether this server collects analytics at all, and for how long it keeps events. Remembered for offline. */
export function useAnalyticsServer() {
  const value = useSyncExternalStore(subscribe, getServer, () => OFF);
  useEffect(() => {
    refreshEnabled();
  }, []);
  return value;
}

async function refreshEnabled() {
  try {
    const res = await fetch("/api/events", { cache: "no-store" });
    if (!res.ok) return;
    const body = (await res.json()) as Partial<ServerSettings>;
    setServer(body.enabled === true && typeof body.retentionDays === "number" ? { enabled: true, retentionDays: body.retentionDays } : OFF);
  } catch {
    // offline: keep the remembered value
  }
}

function setServer(value: ServerSettings) {
  const before = getServer();
  if (value.enabled === before.enabled && value.retentionDays === before.retentionDays) return;
  server = value;
  write(ENABLED_KEY, value);
  if (!value.enabled) clearLocalData();
  emit();
}

export function setAnalyticsConsent(allow: boolean) {
  consent = { status: allow ? "granted" : "declined", decidedAt: new Date().toISOString(), noticeVersion: NOTICE_VERSION };
  write(CONSENT_KEY, consent);
  if (allow) {
    // Fresh ids for every adventure: nothing links back to before this consent.
    forgetStates();
    resetState(activeAdventure().adventure.id);
    track("analytics_consent_changed", { consent: "granted" });
  } else {
    clearLocalData(); // opt-out is immediate: nothing queued is ever sent
  }
  emit();
}

/** Deletes everything analytics keeps on this phone (queue, timers, ids). The consent choice itself stays. */
export function clearLocalData() {
  queue = [];
  write(QUEUE_KEY, null);
  forgetStates();
}

function forgetStates() {
  states.clear();
  clock = null;
  clockPack = null;
  write(LEGACY_STATE_KEY, null);
  for (const id of adventureIds) write(stateKey(id), null);
}

// ---------- adventure state, clock, queue ----------

const states = new Map<string, State>();
/** The active-time clock runs for one adventure pack at a time: the one being played. */
let clock: ClockState | null = null;
let clockPack: string | null = null;
let queue: AnalyticsEvent[] = [];
let sessionId = "";
let errorsThisVisit = 0;

const visible = () => document.visibilityState !== "hidden";

/** A new play-through of `packId`: new id, timers from zero. */
function resetState(packId: string): State {
  const s: State = { adventureId: randomId(), activeMs: 0, quests: {} };
  states.set(packId, s);
  clock = startClock(Date.now(), 0, visible());
  clockPack = packId;
  saveState(packId);
  return s;
}

function loadState(packId: string): State {
  let s = states.get(packId);
  if (!s) {
    const legacy = packId === LEGACY_ADVENTURE_ID ? read<State>(LEGACY_STATE_KEY) : null;
    const raw = read<State>(stateKey(packId)) ?? legacy;
    const valid = raw && typeof raw.adventureId === "string" && typeof raw.activeMs === "number" && raw.quests && typeof raw.quests === "object";
    if (!valid) return resetState(packId);
    s = raw;
    states.set(packId, s);
    if (raw === legacy) saveState(packId);
  }
  if (clockPack !== packId) {
    // Switched adventures: bank the old one's active time and pick up this one's.
    if (clockPack) saveState(clockPack);
    clock = startClock(Date.now(), s.activeMs, visible());
    clockPack = packId;
  }
  return s;
}

function saveState(packId: string | null = clockPack) {
  const s = packId && states.get(packId);
  if (!s) return;
  if (clock && clockPack === packId) s.activeMs = clock.activeMs;
  write(stateKey(packId), s);
}

const activeNow = () => {
  if (clock) clock = tick(clock, Date.now());
  return clock?.activeMs ?? 0;
};

function envelope(adv: AdventureContent) {
  const s = loadState(adv.adventure.id);
  return {
    event_id: randomId(),
    schema_version: SCHEMA_VERSION,
    occurred_at: new Date().toISOString(),
    adventure_id: s.adventureId,
    session_id: sessionId || (sessionId = randomId()),
    app_version: APP_VERSION,
    pack_id: adv.adventure.id,
    content_pack_version: adv.adventure.versions.contentPackVersion,
  } as const;
}

function questFields(adv: AdventureContent, questId: number) {
  const v = adv.versionOf(questId);
  if (!v) return null;
  return {
    quest_id: v.key,
    gallery_id: v.galleryId,
    artwork_id: v.artworkId,
    hidden_detail_id: v.hiddenDetailId,
    riddle_version: v.riddleVersion,
    hint_set_version: v.hintSetVersion,
    artwork_assignment_version: v.artworkAssignmentVersion,
  };
}

function push(event: unknown) {
  queue = enqueue(queue, event as AnalyticsEvent, Date.now());
  write(QUEUE_KEY, queue);
  scheduleFlush();
}

/** Record an adventure-level event for the adventure being played. Does nothing without consent. */
export function track<N extends Exclude<AnalyticsEventName, QuestEventName>>(name: N, properties: PropsOf<N>, adv = activeAdventure()) {
  if (!granted()) return;
  push({ ...envelope(adv), event_name: name, properties });
}

/** Record a quest event; quest IDs and content versions are filled in from the adventure's versions. */
export function trackQuest<N extends QuestEventName>(name: N, questId: number, properties: PropsOf<N>, adv = activeAdventure()) {
  if (!granted()) return;
  const fields = questFields(adv, questId);
  if (!fields) return;
  push({ ...envelope(adv), ...fields, event_name: name, properties });
}

// ---------- quest helpers used by screens ----------

/** The clue for `questId` is on screen. Starts its active timer the first time. */
export function questViewed(questId: number, progress: AdventureState) {
  if (!granted()) return;
  const packId = activeAdventure().adventure.id;
  const s = loadState(packId);
  if (!s.quests[questId]) {
    // A quest already part-way when timing begins can't have a complete solve time.
    const partWay = (progress.hintsUsed[questId] ?? 0) > 0 || (progress.attempts[questId] ?? 0) > 0;
    s.quests[questId] = { startActive: activeNow(), startWall: Date.now(), photos: 0, complete: !partWay };
    saveState(packId);
  }
  trackQuest("quest_viewed", questId, { already_solved: progress.completedQuests.includes(questId) });
}

/** A photo is being sent for checking. Returns the attempt number for the result event. */
export function photoSubmitted(questId: number, source: "camera" | "library"): number {
  if (!granted()) return 0;
  const packId = activeAdventure().adventure.id;
  const s = loadState(packId);
  const mark = (s.quests[questId] ??= { startActive: activeNow(), startWall: Date.now(), photos: 0, complete: false });
  mark.photos += 1;
  saveState(packId);
  trackQuest("quest_photo_submitted", questId, { attempt_number: mark.photos, source });
  return mark.photos;
}

let navigationStartedAt: number | null = null;

/** SHOW ME THE WAY opened the map. */
export function routeRequested(props: PropsOf<"route_requested">, unavailable: PropsOf<"route_unavailable">["reason"] | null) {
  navigationStartedAt = Date.now();
  track("route_requested", props);
  if (unavailable) track("route_unavailable", { ...props, reason: unavailable });
}

/** The child said they reached the gallery. Never inferred from taps or time. */
export function arrivalConfirmed(questId: number, via: "map" | "next_screen") {
  const navigation = navigationStartedAt == null ? null : Math.min(Date.now() - navigationStartedAt, 7 * 24 * 3600_000);
  navigationStartedAt = null;
  trackQuest("quest_arrival_confirmed", questId, { via, navigation_ms: navigation });
}

export const photoAttempts = (questId: number) =>
  granted() ? (loadState(activeAdventure().adventure.id).quests[questId]?.photos ?? 0) : 0;

/** Maps an uncaught error to an allowlisted code. Messages and stacks are never sent. */
export function trackError(err: unknown, component: "global" | "verify" = "global") {
  if (errorsThisVisit >= MAX_ERRORS_PER_VISIT) return;
  errorsThisVisit++;
  const name = err instanceof Error || err instanceof DOMException ? err.name : "Error";
  const code = (ERROR_CODES as readonly string[]).includes(name) ? (name as (typeof ERROR_CODES)[number]) : "Error";
  track("app_error", { code, component });
}

// ---------- events derived from game state ----------

function onProgress(packId: string, prev: AdventureState, next: AdventureState) {
  if (!granted()) return;
  const adv = contentFor(resolveAdventure(packId));
  for (const c of changes(prev, next)) {
    switch (c.type) {
      case "adventure_started":
        // A brand-new adventure gets a brand-new id.
        resetState(packId);
        track("adventure_started", { age_bucket: ageBucket(getProfile().age) }, adv);
        break;
      case "adventure_resumed":
        track("adventure_resumed", { from: "ended_early" }, adv);
        break;
      case "adventure_ended_early": {
        track(
          "adventure_ended_early",
          {
            completed_count: next.completedQuests.length,
            current_quest_id: (adv.versionOf(next.currentQuest) ?? adv.adventure.versions.quests[0]).key,
            reason: "user_action",
            elapsed_ms: elapsed(next.startedAt),
            active_ms: activeNow(),
          },
          adv,
        );
        break;
      }
      case "adventure_completed":
        track(
          "adventure_completed",
          { completed_count: next.completedQuests.length, elapsed_ms: elapsed(next.startedAt), active_ms: activeNow() },
          adv,
        );
        break;
      case "quest_hint_opened":
        trackQuest("quest_hint_opened", c.questId, { hint_level: c.level }, adv);
        break;
      case "quest_completed": {
        const mark = loadState(packId).quests[c.questId];
        trackQuest("quest_completed", c.questId, {
          method: c.method,
          hints_used: c.hintsUsed,
          photo_attempts: mark?.photos ?? 0,
          active_ms: mark ? Math.round(activeNow() - mark.startActive) : null,
          elapsed_ms: mark ? Math.min(Date.now() - mark.startWall, 7 * 24 * 3600_000) : null,
          timing_complete: !!mark?.complete,
        }, adv);
        break;
      }
    }
  }
}

function elapsed(startedAt?: string) {
  if (!startedAt) return null;
  const v = Date.now() - Date.parse(startedAt);
  return Number.isFinite(v) && v >= 0 ? Math.min(Math.round(v), 7 * 24 * 3600_000) : null;
}

/** Restart was confirmed: the event belongs to the old adventure, then a new id begins. */
export function restartConfirmed(prev: AdventureState) {
  if (!granted()) return;
  track("adventure_restart_confirmed", { previous_completed_count: prev.completedQuests.length, previous_status: prev.status });
  resetState(activeAdventure().adventure.id);
}

// ---------- upload ----------

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_DELAY_MS);
}

export async function flush({ keepalive = false } = {}) {
  if (flushing || !queue.length || !granted() || !navigator.onLine) return;
  flushing = true;
  const batch = queue.slice(0, MAX_BATCH);
  try {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive,
      cache: "no-store",
    });
    if (!res.ok) return; // keep everything for the next try
    const body = (await res.json()) as { acknowledged?: string[]; enabled?: boolean };
    if (body.enabled === false) return setServer(OFF);
    queue = acknowledge(queue, new Set(body.acknowledged ?? []));
    write(QUEUE_KEY, queue);
    if (queue.length && !keepalive) scheduleFlush();
  } catch {
    // offline or cut off: retried later; event ids make retries safe
  } finally {
    flushing = false;
  }
}

// ---------- start-up ----------

let started = false;

/** Installs listeners once per page. Safe to call when analytics is off: every path checks consent. */
export function startAnalytics() {
  if (started || typeof window === "undefined") return;
  started = true;
  queue = parseQueue(read(QUEUE_KEY), Date.now());
  const existingSession = read<string>(SESSION_KEY, () => sessionStorage);
  sessionId = existingSession ?? randomId();
  write(SESSION_KEY, sessionId, () => sessionStorage);

  observeProgress(onProgress);
  refreshEnabled().then(() => {
    if (!granted()) return;
    loadState(activeAdventure().adventure.id);
    const progress = getProgress();
    if (!existingSession) {
      const returning = progress.status === "in_progress" || progress.status === "ended_early";
      track("app_opened", { has_returning_adventure: returning });
      if (progress.status === "in_progress") track("adventure_resumed", { from: "reopen" });
    }
    flush();
  });

  const onActivity = () => {
    if (clock) clock = activity(clock, Date.now());
  };
  for (const type of ["pointerdown", "keydown", "scroll", "touchmove"]) {
    window.addEventListener(type, onActivity, { passive: true, capture: true });
  }
  document.addEventListener("visibilitychange", () => {
    const visible = document.visibilityState !== "hidden";
    if (clock) clock = setVisible(clock, visible, Date.now());
    if (!granted()) return;
    saveState();
    if (!visible) flush({ keepalive: true });
  });
  window.addEventListener("online", () => flush());
  window.addEventListener("error", (e) => granted() && trackError(e.error));
  window.addEventListener("unhandledrejection", () => {
    if (granted() && errorsThisVisit < MAX_ERRORS_PER_VISIT) {
      errorsThisVisit++;
      track("app_error", { code: "unhandled_rejection", component: "global" });
    }
  });
  setInterval(() => {
    if (!granted() || !clockPack) return;
    activeNow();
    saveState();
    flush();
  }, FLUSH_EVERY_MS);
}

