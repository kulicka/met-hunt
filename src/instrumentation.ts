// Runs once when each server starts. Kicks off the artwork on-view check in the
// background so startup and the health check are never held up by The Met's API.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.ARTWORK_CHECK === "off") return;
  const { refreshArtworkStatus } = await import("@/lib/server/met-collection");
  refreshArtworkStatus().catch(() => {});
}
