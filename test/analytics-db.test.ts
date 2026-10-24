import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Integration tests against a real Postgres. Run with, for example:
//   TEST_DATABASE_URL=postgres://postgres@localhost:5433/met_test npm test
// Skipped when TEST_DATABASE_URL is not set.

const url = process.env.TEST_DATABASE_URL;
const NOW = Date.now();
let n = 0;
const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
const adv = (i: number) => `aaaaaaaa-0000-4000-8000-${String(i).padStart(12, "0")}`;

function ev(adventure: string, name: string, properties: Record<string, unknown>, quest?: number, at = NOW - 60_000) {
  const k = quest ? String(quest).padStart(2, "0") : null;
  return {
    event_id: id(),
    schema_version: 1,
    occurred_at: new Date(at).toISOString(),
    adventure_id: adventure,
    session_id: "22222222-2222-4222-8222-222222222222",
    app_version: "0.1.0",
    content_pack_version: "2026.10.22-1",
    event_name: name,
    ...(k
      ? {
          quest_id: `q${k}`,
          gallery_id: [810, 815, 816, 817, 818, 819, 821, 822, 824, 825][quest! - 1],
          artwork_id: `art-${k}`,
          hidden_detail_id: `detail-${k}`,
          riddle_version: "r1",
          hint_set_version: "h1",
          artwork_assignment_version: "a1",
        }
      : {}),
    properties,
  };
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/events", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000", host: "localhost:3000", "x-forwarded-for": `10.0.0.${++n % 250}`, ...headers },
    body: JSON.stringify(body),
  });

describe.skipIf(!url)("analytics storage (Postgres)", () => {
  let route: typeof import("@/app/api/events/route");
  let db: typeof import("@/lib/server/analytics-db");
  let dash: typeof import("@/lib/server/dashboard");

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.ANALYTICS_ENABLED = "on";
    route = await import("@/app/api/events/route");
    db = await import("@/lib/server/analytics-db");
    dash = await import("@/lib/server/dashboard");
    await db.ensureSchema();
  });

  beforeEach(async () => {
    await db.pool().query("truncate analytics_events, analytics_admin_audit");
  });

  afterAll(async () => {
    await db?.pool().end();
  });

  it("stores valid events once, even when retried, and acknowledges bad ones without storing them", async () => {
    const a = adv(1);
    const events = [ev(a, "adventure_started", { age_bucket: "8-10" }), ev(a, "quest_viewed", { already_solved: false }, 1)];
    const bad = { ...ev(a, "quest_viewed", { already_solved: false, note: "free text" }, 1) };

    const first = await (await route.POST(post({ events: [...events, bad] }))).json();
    expect(first).toMatchObject({ enabled: true, accepted: 2, duplicates: 0, rejected: 1 });
    expect(first.acknowledged).toContain(bad.event_id);

    const retry = await (await route.POST(post({ events }))).json();
    expect(retry).toMatchObject({ accepted: 0, duplicates: 2 });

    const { rows } = await db.pool().query("select count(*)::int as n from analytics_events");
    expect(rows[0].n).toBe(2);
  });

  it("stores no IP address or user agent", async () => {
    await route.POST(post({ events: [ev(adv(1), "app_opened", { has_returning_adventure: false })] }, { "user-agent": "Mozilla/5.0 Test" }));
    const { rows } = await db.pool().query("select row_to_json(e)::text as j from analytics_events e");
    expect(rows[0].j).not.toMatch(/10\.0\.0\.|Mozilla/);
  });

  it("refuses cross-site posts and malformed batches", async () => {
    expect((await route.POST(post({ events: [ev(adv(1), "app_opened", { has_returning_adventure: false })] }, { origin: "https://evil.example" }))).status).toBe(403);
    expect((await route.POST(post({ nope: [] }))).status).toBe(400);
    expect((await route.POST(post({ events: Array.from({ length: 51 }, () => ev(adv(1), "app_opened", { has_returning_adventure: false })) }))).status).toBe(400);
  });

  it("marks dev builds as test events and leaves them out of every metric", async () => {
    const dev = { ...ev(adv(9), "adventure_started", { age_bucket: "5-7" }), app_version: "0.1.0-dev" };
    await route.POST(post({ events: [dev] }));
    const funnel = await db.pool().query("select adventures from analytics_funnel(now() - interval '1 day', now() + interval '1 day') where step = 'started'");
    expect(Number(funnel.rows[0].adventures)).toBe(0);
  });

  it("tells phones to stop and clear when analytics is turned off", async () => {
    process.env.ANALYTICS_ENABLED = "off";
    try {
      expect(await (await route.POST(post({ events: [] }))).json()).toEqual({ enabled: false, acknowledged: [] });
    } finally {
      process.env.ANALYTICS_ENABLED = "on";
    }
  });

  it("computes metrics with transport errors, parent confirmation, skips and closures kept apart", async () => {
    const events = [];
    // 12 adventures aged 8-10, 2 aged 5-7.
    for (let i = 1; i <= 14; i++) {
      const a = adv(i);
      events.push(ev(a, "adventure_started", { age_bucket: i <= 12 ? "8-10" : "5-7" }));
      events.push(ev(a, "quest_viewed", { already_solved: false }, 1));
    }
    const res = (a: string, attempt: number, result: string, error_kind = "none") =>
      ev(a, "quest_verification_result", { attempt_number: attempt, result, error_kind, model_version: error_kind === "none" ? "claude-opus-5-5" : null, latency_bucket: "5-10s" }, 1);
    const done = (a: string, method: string, active: number) =>
      ev(a, "quest_completed", { method, hints_used: 0, photo_attempts: 1, active_ms: active, elapsed_ms: active, timing_complete: true }, 1);

    // adv 1: verified first time. adv 2: offline first, then verified. adv 3: uncertain, then parent confirms.
    events.push(ev(adv(1), "quest_photo_submitted", { attempt_number: 1, source: "camera" }, 1), res(adv(1), 1, "verified"), done(adv(1), "ai_verified", 60_000));
    events.push(ev(adv(2), "quest_photo_submitted", { attempt_number: 1, source: "camera" }, 1), res(adv(2), 1, "error", "offline"));
    events.push(ev(adv(2), "quest_photo_submitted", { attempt_number: 2, source: "camera" }, 1), res(adv(2), 2, "verified"), done(adv(2), "ai_verified", 120_000));
    events.push(ev(adv(3), "quest_photo_submitted", { attempt_number: 1, source: "library" }, 1), res(adv(3), 1, "uncertain"));
    events.push(ev(adv(3), "quest_parent_override", { kind: "after_attempts", photo_attempts: 1 }, 1), done(adv(3), "parent_confirmed", 300_000));
    events.push(ev(adv(4), "quest_skipped", { reason: "user_switched" }, 1));
    events.push(ev(adv(5), "quest_skipped", { reason: "closed" }, 1));
    events.push(ev(adv(6), "adventure_ended_early", { completed_count: 0, current_quest_id: "q01", reason: "user_action", elapsed_ms: 1000, active_ms: 900 }));
    const route_ = { from_gallery: 810, to_gallery: 815, route_graph_version: "2026.10.22-1", closure_version: "2026-10-22", closures_active: 2 };
    events.push(ev(adv(1), "route_requested", route_), ev(adv(1), "route_unavailable", { ...route_, reason: "no_verified_route" }));
    for (let i = 0; i < events.length; i += 50) await route.POST(post({ events: events.slice(i, i + 50) }));

    const w = ["now() - interval '1 day'", "now() + interval '1 day'"].join(", ");
    const q1 = (await db.pool().query(`select * from analytics_quest_performance(${w}) where quest_id = 'q01'`)).rows[0];
    expect(q1).toMatchObject({ exposures: "14", completions: "3", completions_ai: "2", completions_parent: "1", skips_user: "1", skips_closed: "1", transport_errors: "1", retry_adventures: "1", photo_adventures: "3" });
    // First eligible attempts: adv 1 (verified) and adv 3 (uncertain). adv 2's first try never reached the model.
    expect(q1).toMatchObject({ first_attempts: "2", first_attempts_verified: "1" });
    expect(Number(q1.active_median_ms)).toBe(120_000);

    const funnel = (await db.pool().query(`select * from analytics_funnel(${w})`)).rows;
    expect(funnel.map((r) => Number(r.adventures))).toEqual([14, 3, 0, 0, 0]);
    expect(Number(funnel[0].ended_early)).toBe(1);

    const routes = (await db.pool().query(`select * from analytics_routes(${w})`)).rows[0];
    expect(routes).toMatchObject({ requests: "1", unavailable_no_route: "1", unavailable_closure: "0" });

    const verification = (await db.pool().query(`select * from analytics_verification(${w})`)).rows;
    expect(verification.find((r) => r.model_version === "claude-opus-5-5")).toMatchObject({ verified: "2", uncertain: "1", latency_p50_bucket: "5-10s" });
    expect(verification.find((r) => r.model_version === "(none)")).toMatchObject({ errors: "1", error_offline: "1" });

    // Small cohorts are hidden.
    const ages = (await db.pool().query(`select * from analytics_age_groups(${w}, null, 10)`)).rows;
    expect(ages.find((r) => r.age_bucket === "8-10")).toMatchObject({ adventures: "12", suppressed: false });
    expect(ages.find((r) => r.age_bucket === "5-7")).toMatchObject({ adventures: null, suppressed: true, completed: null });

    // The dashboard shows aggregates only: no adventure or session ids.
    const filters = dash.parseFilters(new URL("http://x/admin"));
    const html = dash.renderDashboard(filters, await dash.loadDashboard(filters), "admin");
    expect(html).toContain("fewer than 10");
    expect(html).not.toMatch(/aaaaaaaa-|22222222-/);
    const csv = await dash.questCsv(filters);
    expect(csv.split("\n")[1]).toMatch(/^quest_id,/);
    expect(csv).not.toMatch(/aaaaaaaa-/);
  });

  it("rates puzzles from each child's last answer and flags low-rated, too-hard and skipped ones", async () => {
    const events = [];
    const rate = (a: string, quest: number, question: string, answer: number, after = "found", at = NOW - 60_000) =>
      ev(a, "quest_rated", { question, answer, after }, quest, at);
    // Quest 1: 12 children, all bored and all found it super hard; most skipped it.
    for (let i = 1; i <= 12; i++) {
      const a = adv(i);
      events.push(ev(a, "quest_viewed", { already_solved: false }, 1));
      if (i <= 8) events.push(ev(a, "quest_skipped", { reason: "user_switched" }, 1));
      events.push(rate(a, 1, "fun", 1, i <= 8 ? "skipped" : "found"), rate(a, 1, "difficulty", 3, i <= 8 ? "skipped" : "found"));
    }
    // Quest 2: 12 children loved it. Child 1 first tapped "meh" and then changed to "super fun".
    for (let i = 1; i <= 12; i++) {
      const a = adv(i);
      events.push(ev(a, "quest_viewed", { already_solved: false }, 2));
      events.push(rate(a, 2, "fun", 3), rate(a, 2, "difficulty", 2));
    }
    events.push(rate(adv(1), 2, "fun", 1, "found", NOW - 120_000));
    // Quest 3: only 2 ratings, too few to flag.
    events.push(rate(adv(1), 3, "fun", 1), rate(adv(2), 3, "fun", 1));
    for (let i = 0; i < events.length; i += 50) await route.POST(post({ events: events.slice(i, i + 50) }));

    const w = ["now() - interval '1 day'", "now() + interval '1 day'"].join(", ");
    const ratings = (await db.pool().query(`select * from analytics_quest_ratings(${w}) order by quest_id`)).rows;
    expect(ratings[0]).toMatchObject({ quest_id: "q01", raters: "12", rated_after_skip: "8", fun_meh: "12", difficulty_super_hard: "12", fun_avg: "1.00" });
    expect(ratings[1]).toMatchObject({ quest_id: "q02", fun_answers: "12", fun_meh: "0", fun_super: "12", fun_avg: "3.00", difficulty_just_right: "12" });

    const health = (await db.pool().query(`select * from analytics_puzzle_health(${w})`)).rows;
    expect(health[0].quest_id).toBe("q01");
    expect(health[0].flags).toEqual(["not_fun", "too_hard", "often_skipped"]);
    expect(health.find((r) => r.quest_id === "q02").flags).toEqual([]);
    expect(health.find((r) => r.quest_id === "q03")).toMatchObject({ fun_answers: "2", flags: [] });

    const filters = dash.parseFilters(new URL("http://x/admin"));
    const html = dash.renderDashboard(filters, await dash.loadDashboard(filters), "admin");
    expect(html).toContain("Puzzle health");
    expect(html).toContain("Too hard to find");
    expect(html).not.toMatch(/aaaaaaaa-/);
  });

  it("deletes events past the retention window", async () => {
    await route.POST(post({ events: [ev(adv(1), "app_opened", { has_returning_adventure: false }), ev(adv(2), "app_opened", { has_returning_adventure: true })] }));
    await db.pool().query("update analytics_events set received_at = now() - interval '200 days' where adventure_id = $1", [adv(1)]);
    expect(await db.purgeExpired()).toBe(1);
    const { rows } = await db.pool().query("select adventure_id from analytics_events");
    expect(rows.map((r) => r.adventure_id)).toEqual([adv(2)]);
  });
});

describe("admin access", () => {
  const req = (auth?: string) => new Request("http://localhost/admin", { headers: auth ? { authorization: auth } : {} });
  const basic = (u: string, p: string) => `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;

  it("doesn't exist without a password, and needs the right one", async () => {
    const { requireAdmin } = await import("@/lib/server/admin-auth");
    const saved = { ...process.env };
    try {
      process.env.ANALYTICS_ENABLED = "off";
      delete process.env.ADMIN_PASSWORD;
      expect(((await requireAdmin(req())) as { response: Response }).response.status).toBe(404);
      process.env.ADMIN_PASSWORD = "correct horse battery";
      expect(((await requireAdmin(req())) as { response: Response }).response.status).toBe(401);
      expect(((await requireAdmin(req(basic("admin", "wrong")))) as { response: Response }).response.status).toBe(401);
      expect(await requireAdmin(req(basic("admin", "correct horse battery")))).toEqual({ ok: true, user: "admin" });
    } finally {
      process.env = saved;
    }
  });
});
