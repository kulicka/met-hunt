import "server-only";
import { pool, ensureSchema, analyticsSettings } from "./analytics-db";

// Aggregate-only analytics dashboard (analytics spec, section 9). Every number
// comes from the SQL functions in db/analytics.sql, with its denominator and
// sample size; there is no view of individual events or adventures.

export interface Filters {
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
  content: string | null;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TOKEN = /^[A-Za-z0-9._-]{1,40}$/;
/** Rates on fewer than this many are shown as raw counts only, so tiny samples can't be ranked. */
export const MIN_SAMPLE = 10;

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function parseFilters(url: URL): Filters {
  const q = url.searchParams;
  const today = new Date();
  const from = q.get("from") && DAY.test(q.get("from")!) ? q.get("from")! : iso(new Date(today.getTime() - 30 * 86_400_000));
  const to = q.get("to") && DAY.test(q.get("to")!) ? q.get("to")! : iso(today);
  const content = q.get("content") && TOKEN.test(q.get("content")!) ? q.get("content")! : null;
  return { from, to, content };
}

/** [from, to + 1 day) as timestamps, so the "to" day is included. */
const range = (f: Filters) => [`${f.from}T00:00:00Z`, new Date(Date.parse(`${f.to}T00:00:00Z`) + 86_400_000).toISOString(), f.content];

type Row = Record<string, string | number | boolean | null>;

async function q(sql: string, params: unknown[]): Promise<Row[]> {
  const { rows } = await pool().query(sql, params);
  return rows as Row[];
}

export async function loadDashboard(f: Filters) {
  await ensureSchema();
  const w = range(f);
  const { minCohort } = analyticsSettings();
  const [overview, funnel, health, quests, verification, routes, exits, ages, versions, tests] = await Promise.all([
    q("select * from analytics_overview($1, $2, $3)", w),
    q("select * from analytics_funnel($1, $2, $3)", w),
    q("select * from analytics_puzzle_health($1, $2, $3, $4)", [...w, MIN_SAMPLE]),
    q("select * from analytics_quest_performance($1, $2, $3)", w),
    q("select * from analytics_verification($1, $2, $3)", w),
    q("select * from analytics_routes($1, $2, $3)", w),
    q("select * from analytics_early_exits($1, $2, $3)", w),
    q("select * from analytics_age_groups($1, $2, $3, $4)", [...w, minCohort]),
    q("select content_pack_version, min(pack_id) as pack_id, min(occurred_at) as first_seen from analytics_events where not is_test group by 1 order by 2", []),
    q("select count(*)::int as n from analytics_events where is_test and occurred_at >= $1 and occurred_at < $2", w.slice(0, 2)),
  ]);
  return { overview, funnel, health, quests, verification, routes, exits, ages, versions, testEvents: Number(tests[0]?.n ?? 0), minCohort };
}

export async function questCsv(f: Filters): Promise<string> {
  await ensureSchema();
  const rows = await q("select * from analytics_quest_performance($1, $2, $3)", range(f));
  const cols = rows.length ? Object.keys(rows[0]) : ["quest_id"];
  const cell = (v: unknown) => {
    const s = v == null ? "" : String(v);
    // Values are IDs and numbers only, but quote defensively and defuse spreadsheet formulas.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const meta = `# Hidden Treasures quest performance, aggregated. Window ${f.from} to ${f.to}${f.content ? `, content ${f.content}` : ""}. Test events excluded.`;
  return [meta, cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n") + "\n";
}

// ---------- HTML ----------

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const num = (v: unknown) => (v == null || v === "" ? 0 : Number(v));

export function rate(n: unknown, d: unknown): string {
  const a = num(n);
  const b = num(d);
  if (b === 0) return "—";
  if (b < MIN_SAMPLE) return `${a}/${b} <span class="small">(small sample)</span>`;
  return `${Math.round((a / b) * 100)}% <span class="small">(${a}/${b})</span>`;
}

/** Plain words for each puzzle-health flag (see analytics_puzzle_health in db/analytics.sql). */
const FLAG_LABELS: Record<string, string> = {
  not_fun: "Not fun",
  too_hard: "Too hard to find",
  too_easy: "Too easy",
  often_skipped: "Often skipped",
  needs_hints: "Needs both hints",
  slow: "Slow to solve",
};

const flagList = (v: unknown) => {
  const flags = Array.isArray(v) ? (v as string[]) : [];
  return flags.length ? flags.map((f) => `<span class="flag">${esc(FLAG_LABELS[f] ?? f)}</span>`).join(" ") : `<span class="small">—</span>`;
};

/** "3 / 5 / 9 · avg 2.4": counts for answers 1, 2, 3, then the average once there are enough. */
const spread = (a: unknown, b: unknown, c: unknown, total: unknown, avg: unknown) =>
  num(total) === 0 ? "—" : `${esc(a)} / ${esc(b)} / ${esc(c)}${num(total) >= MIN_SAMPLE ? ` <span class="small">· avg ${esc(avg)}</span>` : ` <span class="small">(small sample)</span>`}`;

const duration = (v: unknown) => {
  if (v == null) return "—";
  const s = Math.round(Number(v) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function table(head: string[], rows: string[][], empty = "No data in this window.") {
  if (!rows.length) return `<p class="empty">${empty}</p>`;
  return `<div class="scroll"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

export function renderDashboard(f: Filters, d: Awaited<ReturnType<typeof loadDashboard>>, user: string): string {
  const exportQs = new URLSearchParams({ from: f.from, to: f.to, ...(f.content ? { content: f.content } : {}) }).toString();
  const sections = [
    `<section><h2>Overview</h2><p class="note">Adventures that sent a start event in the window, by content version. Adventures already running when analytics was turned on aren't counted as starts.</p>${table(
      ["Content version", "Consented adventures", "Starts", "Completed all 10", "Ended early", "Restarted", "Still open", "Median quests completed"],
      d.overview.map((r) => [esc(r.content_pack_version), esc(r.consented_adventures), esc(r.starts), rate(r.completions, r.starts), rate(r.ended_early, r.starts), rate(r.restarted, r.starts), esc(r.still_open), esc(r.median_quests_completed ?? "—")]),
    )}</section>`,
    `<section><h2>Funnel</h2><p class="note">Adventures started in the window, by quests completed so far (later events of those adventures included). "Still open" may finish later.</p>${table(
      ["Step", "Adventures", "of starts", "…then completed", "…ended early", "…restarted", "…still open"],
      d.funnel.map((r) => [esc(r.step), esc(r.adventures), rate(r.adventures, d.funnel[0]?.adventures), esc(r.completed), esc(r.ended_early), esc(r.restarted), esc(r.still_open)]),
    )}</section>`,
    `<section><h2>Puzzle health</h2><p class="note">Kids’ own ratings, tapped after a mystery was found or skipped (optional, so not every child rates), next to what they did. Answers are 1 / 2 / 3: fun is meh / fun / super fun, hard to find is easy / just right / super hard; only each child’s last answer counts. Flags need ${MIN_SAMPLE}+ answers or exposures; thresholds are parameters of <code>analytics_puzzle_health</code>. Most-flagged first.</p>${table(
      ["Quest", "Gallery", "Riddle / hints / artwork", "Flags", "Rated by", "…after skipping", "Fun (meh / fun / super)", "Hard to find (easy / right / super hard)", "Skipped (user)", "Used hint 2", "Median active solve"],
      d.health.map((r) => [
        esc(r.quest_id), esc(r.gallery_id),
        `${esc(r.riddle_version)} / ${esc(r.hint_set_version)} / ${esc(r.artwork_assignment_version)}`,
        flagList(r.flags),
        esc(r.raters), esc(r.rated_after_skip),
        spread(r.fun_meh, r.fun_fun, r.fun_super, r.fun_answers, r.fun_avg),
        spread(r.difficulty_easy, r.difficulty_just_right, r.difficulty_super_hard, r.difficulty_answers, r.difficulty_avg),
        rate(r.skips_user, r.exposures), rate(r.hint2_adventures, r.exposures),
        num(r.timed_solves) >= MIN_SAMPLE ? duration(r.active_median_ms) : "—",
      ]),
    )}</section>`,
    `<section><h2>Quest performance</h2><p class="note">One row per quest and content version. Solve times are active time (background and idle beyond 90 s excluded), solved quests only, so read them with the skip and exposure counts. Rates under ${MIN_SAMPLE} are shown as counts only.</p>${table(
      ["Quest", "Gallery", "Artwork", "Riddle / hints / artwork", "Exposures", "Completed", "Parent confirmed", "Used a hint", "Used hint 2", "First photo verified", "Retried photo", "Uncertain / likely", "Not found", "Transport errors", "Skipped (user)", "Skipped (closed)", "Median active solve", "IQR", "Timed solves"],
      d.quests.map((r) => [
        esc(r.quest_id), esc(r.gallery_id), esc(r.artwork_id),
        `${esc(r.riddle_version)} / ${esc(r.hint_set_version)} / ${esc(r.artwork_assignment_version)}`,
        esc(r.exposures), rate(r.completions, r.exposures), rate(r.completions_parent, r.completions),
        rate(r.hint_adventures, r.exposures), rate(r.hint2_adventures, r.exposures),
        rate(r.first_attempts_verified, r.first_attempts), rate(r.retry_adventures, r.photo_adventures),
        esc(r.results_uncertain), esc(r.results_not_found), esc(r.transport_errors),
        esc(r.skips_user), esc(r.skips_closed),
        num(r.timed_solves) >= MIN_SAMPLE ? duration(r.active_median_ms) : "—",
        num(r.timed_solves) >= MIN_SAMPLE ? `${duration(r.active_p25_ms)}–${duration(r.active_p75_ms)}` : "—",
        esc(r.timed_solves),
      ]),
    )}</section>`,
    `<section><h2>Photo checks</h2><p class="note">By the model that answered. Transport errors (offline, timeout, server unavailable) never reached the model and are counted separately. Latency is bucketed on the phone.</p>${table(
      ["Model", "Results", "Verified", "Likely", "Not found", "Uncertain", "Unusable photo", "Errors", "Offline", "Timeout", "Unavailable", "Rate limited", "Rejected", "p50 latency", "p95 latency"],
      d.verification.map((r) => {
        const checked = num(r.results) - num(r.errors);
        return [esc(r.model_version), esc(r.results), rate(r.verified, checked), rate(r.likely, checked), rate(r.not_found, checked), rate(r.uncertain, checked), rate(r.invalid_image, checked), rate(r.errors, r.results), esc(r.error_offline), esc(r.error_timeout), esc(r.error_unavailable), esc(r.error_rate_limited), esc(r.error_rejected), esc(r.latency_p50_bucket ?? "—"), esc(r.latency_p95_bucket ?? "—")];
      }),
    )}</section>`,
    `<section><h2>Navigation</h2><p class="note">SHOW ME THE WAY requests, and how often no verified open route existed: no verified doorway (map data gap) versus a closure in the way. Arrivals are the child's own "I'm there" taps; the navigation interval is not a measured walk.</p>${table(
      ["From", "To", "Graph version", "Closures version", "Requests", "No verified route", "Blocked by closure", "Arrivals at destination", "Median navigation interval"],
      d.routes.map((r) => [esc(r.from_gallery), esc(r.to_gallery), esc(r.route_graph_version), esc(r.closure_version), esc(r.requests), rate(r.unavailable_no_route, r.requests), rate(r.unavailable_closure, r.requests), esc(r.arrivals_after ?? 0), duration(r.navigation_median_ms)]),
    )}</section>`,
    `<section><h2>Early endings</h2><p class="note">The quest on screen when a grown-up ended the adventure early. This shows where, not why.</p>${table(
      ["Quest on screen", "Quests completed", "Adventures"],
      d.exits.map((r) => [esc(r.current_quest_id), esc(r.completed_count), esc(r.adventures)]),
    )}</section>`,
    `<section><h2>Age groups</h2><p class="note">Groups with fewer than ${d.minCohort} adventures are hidden.</p>${table(
      ["Age group", "Adventures", "Completed all 10", "Median quests completed"],
      d.ages.map((r) => (r.suppressed ? [esc(r.age_bucket), `fewer than ${d.minCohort}`, "hidden", "hidden"] : [esc(r.age_bucket), esc(r.adventures), rate(r.completed, r.adventures), esc(r.median_quests_completed)])),
    )}</section>`,
  ];

  const versionOptions = d.versions
    .map((v) => `<option value="${esc(v.content_pack_version)}"${v.content_pack_version === f.content ? " selected" : ""}>${esc(v.pack_id)} · ${esc(v.content_pack_version)}</option>`)
    .join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Hunt analytics</title>
<style>
:root{--bg:#fbf8f1;--card:#fff;--ink:#23201c;--soft:#5a5248;--line:#e2d9c6;--accent:#7a1f2b}
@media (prefers-color-scheme:dark){:root{--bg:#1b1916;--card:#25221e;--ink:#f1ebe0;--soft:#b8ad9c;--line:#3d3830;--accent:#e08a96}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1200px;margin:0 auto;padding:16px}h1{font-family:Georgia,serif;margin:.2em 0}h2{font-family:Georgia,serif;margin:0 0 .3em}
section{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin:16px 0}
.note,.small,.meta{color:var(--soft)}.small{font-size:12px}.scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}th,td{text-align:left;padding:6px 10px;border-bottom:1px solid var(--line);white-space:nowrap;vertical-align:top}
th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--soft)}
form{display:flex;flex-wrap:wrap;gap:8px;align-items:end}label{display:flex;flex-direction:column;font-size:12px;color:var(--soft)}
input,select,button,a.btn{font:inherit;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink)}
button{background:var(--accent);color:#fff;border-color:var(--accent)}.flag{display:inline-block;margin:0 2px 2px 0;padding:1px 8px;border-radius:999px;border:1px solid var(--accent);color:var(--accent);font-size:12px;font-weight:600}a.btn{text-decoration:none}.empty{color:var(--soft)}
</style></head><body><main>
<h1>Hidden Treasures analytics</h1>
<p class="meta">Aggregates only, from consenting phones. Window ${esc(f.from)} to ${esc(f.to)} (UTC)${f.content ? `, content ${esc(f.content)}` : ", all content versions"}. ${d.testEvents} test events excluded. Signed in as ${esc(user)}; this view is logged.</p>
<form method="get">
<label>From<input type="date" name="from" value="${esc(f.from)}"></label>
<label>To<input type="date" name="to" value="${esc(f.to)}"></label>
<label>Adventure · content version<select name="content"><option value="">All</option>${versionOptions}</select></label>
<button type="submit">Apply</button>
<a class="btn" href="/admin/export?${esc(exportQs)}">Download quest table (CSV)</a>
</form>
${sections.join("\n")}
<p class="note">Before changing a riddle because of these numbers, check for confounders: the artwork moved, crowds, closures, signal, camera quality, or a new verification model. Riddle edits need the owner's approval and a new content version (docs/content-versions.md).</p>
</main></body></html>`;
}
