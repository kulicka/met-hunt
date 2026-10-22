import { connection } from "next/server";
import { artworkStatus, isStale, refreshArtworkStatus } from "@/lib/server/met-collection";

// Latest on-view check of the quest artworks (started when the server boots).
// Answers with what is known now and refreshes in the background when stale.

export async function GET() {
  await connection();
  const list = artworkStatus();
  if (isStale(list) && process.env.ARTWORK_CHECK !== "off") refreshArtworkStatus().catch(() => {});
  return Response.json(list, { headers: { "Cache-Control": "no-store" } });
}
