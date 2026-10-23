import { AnalyticsEvent } from "./schema";

// The local outbox for consented events, kept small for unreliable museum
// signal. Pure functions; the store that persists it is in client.ts.

export const QUEUE_MAX_EVENTS = 300;
export const QUEUE_MAX_AGE_MS = 7 * 24 * 3600_000;

/** Reads a stored queue, dropping anything corrupt, unknown, or too old. */
export function parseQueue(raw: unknown, now: number): AnalyticsEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: AnalyticsEvent[] = [];
  for (const item of raw) {
    const parsed = AnalyticsEvent.safeParse(item);
    if (parsed.success && now - Date.parse(parsed.data.occurred_at) <= QUEUE_MAX_AGE_MS) out.push(parsed.data);
  }
  return out.slice(-QUEUE_MAX_EVENTS);
}

/** Adds an event, keeping the newest QUEUE_MAX_EVENTS and none older than QUEUE_MAX_AGE_MS. */
export function enqueue(queue: AnalyticsEvent[], event: AnalyticsEvent, now: number): AnalyticsEvent[] {
  return [...queue, event].filter((e) => now - Date.parse(e.occurred_at) <= QUEUE_MAX_AGE_MS).slice(-QUEUE_MAX_EVENTS);
}

/** Removes the events the server has acknowledged (accepted, duplicate, or permanently rejected). */
export const acknowledge = (queue: AnalyticsEvent[], ids: Set<string>) => queue.filter((e) => !ids.has(e.event_id));
