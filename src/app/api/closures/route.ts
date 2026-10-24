import { readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { bundledClosures, type ClosureList } from "@/data/closures";
import { isStale, liveClosures, refreshClosures, wantsRecheck } from "@/lib/server/met-closures";

// Serves the current closure list. Order of precedence:
// 1. the CLOSURES_JSON environment variable, a manual override (on Fly.io: `fly secrets set`);
// 2. The Met's gallery closures page, read by the server (src/lib/server/met-closures.ts);
// 3. data/closures.json read from disk, then the copy bundled at build time.
// `?fresh=1` (sent when a hunt starts or restarts) waits for a new read of the page
// if the last one is more than a few minutes old; otherwise a stale list is
// refreshed in the background for the next request.

export async function GET(request: Request) {
  await connection();
  const fresh = new URL(request.url).searchParams.has("fresh");
  if (!process.env.CLOSURES_JSON) {
    if (fresh && wantsRecheck()) await refreshClosures().catch(() => {});
    else if (isStale()) refreshClosures().catch(() => {});
  }
  let list: ClosureList = { ...bundledClosures, source: "file" };
  try {
    if (process.env.CLOSURES_JSON) list = { ...JSON.parse(process.env.CLOSURES_JSON), source: "manual" };
    else list = liveClosures() ?? { ...JSON.parse(await readFile(path.join(process.cwd(), "data", "closures.json"), "utf8")), source: "file" };
  } catch {
    // fall back to the copy bundled at build time
  }
  return Response.json(list, { headers: { "Cache-Control": "no-store" } });
}
