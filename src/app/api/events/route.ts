import { connection } from "next/server";
import { analyticsSettings, insertEvents } from "@/lib/server/analytics-db";
import { checkEventsRateLimit } from "@/lib/server/rate-limit";
import { AnalyticsEvent, EventBatch, MAX_BODY_BYTES } from "@/lib/analytics/schema";
import { QUEUE_MAX_AGE_MS } from "@/lib/analytics/queue";

// First-party analytics ingestion (analytics spec, section 11).
// - Strict allowlist: an event with any unexpected field or value is rejected.
// - Idempotent: event_id is the primary key, so retries and offline replays count once.
// - Nothing about the sender is stored: no IP address, no user agent, no cookies.
//   (The rate limiter keys on a salted hash of the IP, in memory only.)

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FUTURE_SLACK_MS = 24 * 3600_000;

export async function GET() {
  await connection();
  const { enabled, retentionDays } = analyticsSettings();
  return json({ enabled, retentionDays });
}

/** Same-site requests only: browsers send Origin on POST and Sec-Fetch-Site everywhere modern. */
function sameOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const settings = analyticsSettings();
  // Collection is off: tell the phone, which then deletes its queue.
  if (!settings.enabled) return json({ enabled: false, acknowledged: [] });

  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "unsupported_type" }, 415);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return json({ error: "too_large" }, 413);
  if (!checkEventsRateLimit(request)) return json({ error: "rate_limited" }, 429);

  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return json({ error: "too_large" }, 413);
  let batch;
  try {
    batch = EventBatch.parse(JSON.parse(text));
  } catch {
    return json({ error: "invalid_batch" }, 400);
  }

  const now = Date.now();
  const valid: AnalyticsEvent[] = [];
  const acknowledged: string[] = [];
  let rejected = 0;
  for (const raw of batch.events) {
    const parsed = AnalyticsEvent.safeParse(raw);
    const at = parsed.success ? Date.parse(parsed.data.occurred_at) : NaN;
    if (parsed.success && at <= now + FUTURE_SLACK_MS && now - at <= QUEUE_MAX_AGE_MS + FUTURE_SLACK_MS) {
      valid.push(parsed.data);
      acknowledged.push(parsed.data.event_id);
    } else {
      rejected++;
      // Acknowledge bad events too (when they have a usable id) so the phone stops resending them.
      const id = (raw as { event_id?: unknown })?.event_id;
      if (typeof id === "string" && UUID.test(id)) acknowledged.push(id);
    }
  }

  // Dev builds send app versions ending in "-dev"; a staging server can mark everything as test.
  const markAll = process.env.ANALYTICS_MARK_TEST === "on";
  try {
    const accepted = await insertEvents(valid, (e) => markAll || e.app_version.endsWith("-dev"));
    if (rejected) console.warn(`[analytics] rejected ${rejected} of ${batch.events.length} events`);
    return json({ enabled: true, acknowledged, accepted, duplicates: valid.length - accepted, rejected });
  } catch (err) {
    // Never log the payload. The phone keeps its queue and retries later.
    console.error("[analytics] insert failed:", err instanceof Error ? err.message.slice(0, 200) : typeof err);
    return json({ error: "storage_unavailable" }, 503);
  }
}
