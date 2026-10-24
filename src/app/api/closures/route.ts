import { readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { bundledClosures, type ClosureList } from "@/data/closures";
import { isStale, liveClosures, refreshClosures } from "@/lib/server/met-closures";

// Serves the current closure list. Order of precedence:
// 1. the CLOSURES_JSON environment variable, a manual override (on Fly.io: `fly secrets set`);
// 2. The Met's gallery closures page, read by the server (src/lib/server/met-closures.ts);
// 3. data/closures.json read from disk, then the copy bundled at build time.

export async function GET() {
  await connection();
  if (isStale()) refreshClosures().catch(() => {});
  let list: ClosureList = bundledClosures;
  try {
    if (process.env.CLOSURES_JSON) list = JSON.parse(process.env.CLOSURES_JSON);
    else list = liveClosures() ?? JSON.parse(await readFile(path.join(process.cwd(), "data", "closures.json"), "utf8"));
  } catch {
    // fall back to the copy bundled at build time
  }
  return Response.json(list, { headers: { "Cache-Control": "no-store" } });
}
