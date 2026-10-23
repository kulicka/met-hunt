import { connection } from "next/server";
import { requireAdmin } from "@/lib/server/admin-auth";
import { analyticsSettings, audit } from "@/lib/server/analytics-db";
import { loadDashboard, parseFilters, renderDashboard } from "@/lib/server/dashboard";

// Admin-only analytics dashboard. Server-rendered HTML with no scripts; aggregates only.

const headers = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
};

export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (!analyticsSettings().enabled) {
    return new Response("<!doctype html><title>Hunt analytics</title><p>Analytics is off on this server (set ANALYTICS_ENABLED=on and DATABASE_URL).</p>", { headers });
  }
  const filters = parseFilters(new URL(request.url));
  try {
    const data = await loadDashboard(filters);
    await audit(auth.user, "view_dashboard", `${filters.from}..${filters.to} ${filters.content ?? "all"}`);
    return new Response(renderDashboard(filters, data, auth.user), { headers });
  } catch (err) {
    console.error("[analytics] dashboard failed:", err instanceof Error ? err.message.slice(0, 200) : typeof err);
    return new Response("<!doctype html><title>Hunt analytics</title><p>The analytics database is unavailable right now.</p>", { status: 503, headers });
  }
}
