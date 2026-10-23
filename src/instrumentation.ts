// Runs once when each server starts. Background jobs only, so startup and the
// health check are never held up by The Met's API or the analytics database.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.ARTWORK_CHECK !== "off") {
    const { refreshArtworkStatus } = await import("@/lib/server/met-collection");
    refreshArtworkStatus().catch(() => {});
  }
  // Applies the analytics schema and deletes expired events, then repeats daily. No-op unless enabled.
  const { startRetentionJob } = await import("@/lib/server/analytics-db");
  startRetentionJob();
}
