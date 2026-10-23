import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { CONTENT_PACK_VERSION, questVersions } from "@/data/hidden-treasures/versions";
import type { AnalyticsEvent } from "@/lib/analytics/schema";

// Postgres storage for analytics events. Off unless ANALYTICS_ENABLED=on and
// DATABASE_URL are both set; the game never depends on it.
//
// Shared through globalThis because instrumentation and route handlers load
// separate copies of server modules (see met-collection.ts).

export interface AnalyticsSettings {
  enabled: boolean;
  retentionDays: number;
  minCohort: number;
}

export function analyticsSettings(): AnalyticsSettings {
  const days = Number(process.env.ANALYTICS_RETENTION_DAYS);
  const cohort = Number(process.env.ANALYTICS_MIN_COHORT);
  return {
    enabled: process.env.ANALYTICS_ENABLED === "on" && Boolean(process.env.DATABASE_URL),
    retentionDays: Number.isInteger(days) && days > 0 ? days : 180,
    minCohort: Number.isInteger(cohort) && cohort > 0 ? cohort : 10,
  };
}

interface Store {
  pool?: Pool;
  ready?: Promise<void>;
  retention?: ReturnType<typeof setInterval>;
}
const store: Store = ((globalThis as { __metAnalytics?: Store }).__metAnalytics ??= {});

export function pool(): Pool {
  store.pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5000,
    // Neon and most hosted Postgres need TLS; local test databases don't.
    ssl: /sslmode=(require|verify)/.test(process.env.DATABASE_URL ?? "") ? { rejectUnauthorized: false } : undefined,
  });
  return store.pool;
}

const SCHEMA_LOCK = 4_242_001;

/** Applies db/analytics.sql (idempotent) and records the current content versions. Once per process. */
export function ensureSchema(): Promise<void> {
  store.ready ??= (async () => {
    const sql = await readFile(path.join(process.cwd(), "db", "analytics.sql"), "utf8");
    const client = await pool().connect();
    try {
      await client.query("begin");
      // Two machines starting together must not replace the same functions at once.
      await client.query("select pg_advisory_xact_lock($1)", [SCHEMA_LOCK]);
      await client.query(sql);
      for (const q of questVersions) {
        await client.query(
          `insert into analytics_content_versions
             (content_pack_version, quest_id, gallery_id, artwork_id, hidden_detail_id, riddle_version,
              hint_set_version, artwork_assignment_version, riddle_fingerprint, hints_fingerprint)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           on conflict (content_pack_version, quest_id) do nothing`,
          [CONTENT_PACK_VERSION, q.key, q.galleryId, q.artworkId, q.hiddenDetailId, q.riddleVersion, q.hintSetVersion,
            q.artworkAssignmentVersion, q.riddleFingerprint, q.hintsFingerprint],
        );
      }
      await client.query("commit");
    } catch (err) {
      await client.query("rollback").catch(() => {});
      store.ready = undefined; // try again on the next request
      throw err;
    } finally {
      client.release();
    }
  })();
  return store.ready;
}

const COLUMNS = [
  "event_id", "event_name", "schema_version", "occurred_at", "adventure_id", "session_id", "app_version",
  "content_pack_version", "quest_id", "gallery_id", "artwork_id", "hidden_detail_id", "riddle_version",
  "hint_set_version", "artwork_assignment_version", "properties", "is_test",
] as const;

/** Inserts validated events; duplicates (same event_id) are ignored. Returns how many were new. */
export async function insertEvents(events: AnalyticsEvent[], isTest: (e: AnalyticsEvent) => boolean): Promise<number> {
  if (!events.length) return 0;
  await ensureSchema();
  const values: unknown[] = [];
  const rows = events.map((e) => {
    const q = "quest_id" in e ? e : null;
    const row = [
      e.event_id, e.event_name, e.schema_version, e.occurred_at, e.adventure_id, e.session_id, e.app_version,
      e.content_pack_version, q?.quest_id ?? null, q?.gallery_id ?? null, q?.artwork_id ?? null,
      q?.hidden_detail_id ?? null, q?.riddle_version ?? null, q?.hint_set_version ?? null,
      q?.artwork_assignment_version ?? null, JSON.stringify(e.properties), isTest(e),
    ];
    const start = values.length;
    values.push(...row);
    return `(${row.map((_, i) => `$${start + i + 1}`).join(", ")})`;
  });
  const result = await pool().query(
    `insert into analytics_events (${COLUMNS.join(", ")}) values ${rows.join(", ")} on conflict (event_id) do nothing`,
    values,
  );
  return result.rowCount ?? 0;
}

export async function purgeExpired(): Promise<number> {
  await ensureSchema();
  const { rows } = await pool().query<{ n: string }>("select analytics_purge($1) as n", [analyticsSettings().retentionDays]);
  return Number(rows[0]?.n ?? 0);
}

/** Runs retention now and then daily. Called from instrumentation at server start. */
export function startRetentionJob() {
  if (!analyticsSettings().enabled || store.retention) return;
  const run = () =>
    purgeExpired().then(
      (n) => n > 0 && console.log(`[analytics] retention removed ${n} expired events`),
      (err) => console.error("[analytics] retention failed:", err instanceof Error ? err.message.slice(0, 200) : typeof err),
    );
  run();
  store.retention = setInterval(run, 24 * 3600_000);
  store.retention.unref?.();
}

export async function audit(adminUser: string, action: "view_dashboard" | "export_csv" | "denied", detail?: string) {
  console.log(`[analytics] admin ${action} by ${adminUser}${detail ? ` (${detail})` : ""}`);
  if (!analyticsSettings().enabled) return;
  try {
    await ensureSchema();
    await pool().query("insert into analytics_admin_audit (admin_user, action, detail) values ($1, $2, $3)", [
      adminUser.slice(0, 64), action, detail?.slice(0, 200) ?? null,
    ]);
  } catch {
    // the console line above is the fallback record
  }
}
