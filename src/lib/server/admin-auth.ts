import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { audit } from "./analytics-db";
import { checkEventsRateLimit } from "./rate-limit";

// HTTP Basic auth for the analytics dashboard. Separate credentials from
// anything else (ADMIN_USER / ADMIN_PASSWORD Fly secrets); without a password
// the dashboard doesn't exist. Fly forces HTTPS, so the header is never sent in clear.

const digest = (s: string) => createHash("sha256").update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export type AdminCheck = { ok: true; user: string } | { ok: false; response: Response };

export async function requireAdmin(request: Request): Promise<AdminCheck> {
  const password = process.env.ADMIN_PASSWORD;
  const user = process.env.ADMIN_USER || "admin";
  if (!password || password.length < 12) return { ok: false, response: new Response("Not found", { status: 404 }) };

  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const i = decoded.indexOf(":");
    if (i > 0 && same(decoded.slice(0, i), user) && same(decoded.slice(i + 1), password)) return { ok: true, user };
    // Wrong credentials: count against the limiter and leave a record.
    if (!checkEventsRateLimit(request)) return { ok: false, response: new Response("Too many attempts", { status: 429 }) };
    await audit("(unknown)", "denied");
  }
  return {
    ok: false,
    response: new Response("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Hidden Treasures analytics", charset="UTF-8"', "Cache-Control": "no-store" },
    }),
  };
}
