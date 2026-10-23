import { connection } from "next/server";
import { requireAdmin } from "@/lib/server/admin-auth";
import { analyticsSettings, audit } from "@/lib/server/analytics-db";
import { parseFilters, questCsv } from "@/lib/server/dashboard";

// Aggregated quest table as CSV. There is deliberately no export of individual events.

export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (!analyticsSettings().enabled) return new Response("Analytics is off", { status: 404 });
  const filters = parseFilters(new URL(request.url));
  try {
    const csv = await questCsv(filters);
    await audit(auth.user, "export_csv", `${filters.from}..${filters.to} ${filters.content ?? "all"}`);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="quest-performance-${filters.from}-to-${filters.to}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[analytics] export failed:", err instanceof Error ? err.message.slice(0, 200) : typeof err);
    return new Response("The analytics database is unavailable right now.", { status: 503 });
  }
}
