import "server-only";
import { createHash } from "node:crypto";

// In-memory sliding-window limits. Per server instance only: on a multi-instance
// deployment, move this to a shared store (e.g. Redis/Upstash) before launch.
// Clients are keyed by a salted hash so raw IP addresses are never kept.

const PER_CLIENT = { limit: 20, windowMs: 10 * 60_000 };
const GLOBAL = { limit: 600, windowMs: 60 * 60_000 };
const SALT = process.env.RATE_LIMIT_SALT ?? "met-hidden-treasures";

const hits = new Map<string, number[]>();

function allow(key: string, { limit, windowMs }: { limit: number; windowMs: number }, now: number) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function checkRateLimit(request: Request): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const client = createHash("sha256").update(SALT + ip).digest("base64url").slice(0, 16);
  const now = Date.now();
  if (hits.size > 10_000) hits.clear(); // crude memory cap
  return allow(client, PER_CLIENT, now) && allow("global", GLOBAL, now);
}
