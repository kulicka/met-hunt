import { readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { bundledClosures, type ClosureList } from "@/data/closures";

// Serves the current closure list without needing a rebuild. Order of precedence:
// the CLOSURES_JSON environment variable (on Fly.io: `fly secrets set`), then
// data/closures.json read from disk, then the copy bundled at build time.

export async function GET() {
  await connection();
  let list: ClosureList = bundledClosures;
  try {
    list = JSON.parse(process.env.CLOSURES_JSON || (await readFile(path.join(process.cwd(), "data", "closures.json"), "utf8")));
  } catch {
    // fall back to the copy bundled at build time
  }
  return Response.json(list, { headers: { "Cache-Control": "no-store" } });
}
