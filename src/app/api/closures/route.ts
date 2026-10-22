import { readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { bundledClosures, type ClosureList } from "@/data/closures";

// Serves data/closures.json, read on every request so closures can be updated
// on the server without rebuilding the app.

export async function GET() {
  await connection();
  let list: ClosureList = bundledClosures;
  try {
    list = JSON.parse(await readFile(path.join(process.cwd(), "data", "closures.json"), "utf8"));
  } catch {
    // fall back to the copy bundled at build time
  }
  return Response.json(list, { headers: { "Cache-Control": "no-store" } });
}
