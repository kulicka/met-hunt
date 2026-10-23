# Analytics

First-party game analytics that tell us which riddles, hints, artworks and routes
work for kids (spec: [analytics-spec.txt](analytics-spec.txt)). It's **off** until
two things are true:

1. The server has `ANALYTICS_ENABLED=on` and a `DATABASE_URL`.
2. A grown-up turns it on in the grown-ups area on their phone. Nothing is recorded
   before that, and the game plays the same with analytics off or offline.

> **Before launch:** have a children's privacy review (COPPA and any state or
> international rules that apply) look at this document and the in-app notice.
> This is a product design, not a legal determination. Keep `ANALYTICS_ENABLED`
> unset in production until that review is done.

## Setup (Postgres)

1. Create a database. [Neon](https://neon.tech) (free tier) works; so does Fly
   Managed Postgres. Copy its connection string (with `?sslmode=require`).
2. Set the Fly secrets (this restarts the machines):

   ```sh
   fly secrets set DATABASE_URL='postgres://…?sslmode=require' \
     ADMIN_PASSWORD='a-long-random-password' \
     ANALYTICS_ENABLED=on
   ```

   Optional: `ADMIN_USER` (default `admin`), `ANALYTICS_RETENTION_DAYS` (default
   180), `ANALYTICS_MIN_COHORT` (default 10), `ANALYTICS_MARK_TEST=on` on a staging
   server so its events are kept out of every metric.
3. The server applies [`db/analytics.sql`](../db/analytics.sql) at start (safe to run
   again; you can also run it yourself with `psql "$DATABASE_URL" -f db/analytics.sql`).
4. Open `https://met-hunt.fly.dev/admin` and sign in with `ADMIN_USER` / `ADMIN_PASSWORD`.
   Without `ADMIN_PASSWORD` (12+ characters) the dashboard returns 404.

Turning `ANALYTICS_ENABLED` off later stops collection: the consent card disappears
and phones delete their queued events the next time they reach the server.

## What's collected

Every event: `event_id` (random UUID), `event_name`, `schema_version`,
`occurred_at` (UTC, phone clock), `adventure_id` (random, new for every new
adventure), `session_id` (random, per visit), `app_version`,
`content_pack_version`. Quest events add `quest_id`, `gallery_id`, `artwork_id`,
`hidden_detail_id`, `riddle_version`, `hint_set_version`,
`artwork_assignment_version` from
[`versions.ts`](../src/data/hidden-treasures/versions.ts). The server adds
`received_at` and `is_test`.

| Event | Properties | Sent when |
| --- | --- | --- |
| `analytics_consent_changed` | `consent: granted` | A grown-up turns analytics on. A withdrawal is never sent. |
| `app_opened` | `has_returning_adventure` | First load of a visit |
| `adventure_started` | `age_bucket` (5-7, 8-10, 11+, unknown) | A new adventure begins |
| `adventure_resumed` | `from` (reopen, ended_early) | Reopened mid-adventure, or continued after ending early |
| `adventure_ended_early` | `completed_count`, `current_quest_id`, `reason: user_action`, `elapsed_ms`, `active_ms` | END ADVENTURE confirmed |
| `adventure_completed` | `completed_count`, `elapsed_ms`, `active_ms` | All ten found |
| `adventure_restart_confirmed` | `previous_completed_count`, `previous_status` | YES, START OVER (cancel sends nothing). The next adventure gets a new id. |
| `quest_viewed` | `already_solved` | Clue screen shown |
| `quest_arrival_confirmed` | `via`, `navigation_ms` | The child taps "I'M THERE". Never inferred. |
| `quest_hint_opened` | `hint_level` (1, 2) | GET A HINT |
| `quest_photo_submitted` | `attempt_number`, `source` (camera, library) | USE THIS PHOTO. No photo or image data. |
| `quest_verification_result` | `attempt_number`, `result`, `error_kind`, `model_version`, `latency_bucket` | Checker answered or failed. Never the model's output. |
| `quest_parent_override` | `kind` (after_attempts, without_photo, answer_key), `photo_attempts` | Grown-up confirms a find |
| `quest_completed` | `method` (ai_verified, parent_confirmed), `hints_used`, `photo_attempts`, `active_ms`, `elapsed_ms`, `timing_complete` | Quest solved |
| `quest_skipped` | `reason` (closed, user_switched) | Closed-gallery skip, or picking a different mystery on the map |
| `route_requested` | `from_gallery`, `to_gallery`, `route_graph_version`, `closure_version`, `closures_active` | SHOW ME THE WAY |
| `route_unavailable` | same + `reason` (no_verified_route, closure_blocking) | No verified open route |
| `map_opened` | `source` (quest, found, menu) | Map screen |
| `app_error` | `code` (allowlisted error class), `component` | Uncaught error. No message or stack. At most 5 per visit. |

Never collected: photos or image metadata, names, birthdays, email, location or
GPS, the explorer picked, free text, IP addresses, user agents, cookies, device or
advertising ids, or anything that links one adventure to the next. The schema
([`schema.ts`](../src/lib/analytics/schema.ts)) is strict: an event with any field
or value outside the allowlist is rejected by the server.

## How it works

- **Phone** ([`client.ts`](../src/lib/analytics/client.ts)): events go into a local
  queue (`met-hidden-treasures:analytics-queue:v1`, at most 300 events and 7 days),
  uploaded in batches of up to 50 a few seconds after each event, every 30 s, when
  the signal comes back, and when the page is hidden. Turning analytics off deletes
  the queue and timers immediately. A corrupt queue is discarded.
- **Server** ([`/api/events`](../src/app/api/events/route.ts)): same-origin only,
  JSON only, 64 KB and 50 events per batch, rate limited per client (salted IP hash,
  in memory, never stored). Each event is validated; `event_id` is the primary key,
  so retries and offline replays count once.
- **Active time** ([`clock.ts`](../src/lib/analytics/clock.ts)): counts only while
  the page is visible, and only up to 90 s after the last touch, key or scroll. A
  quest's active time runs from when its clue is first shown to when it's solved.
  Quests already part-way when analytics was turned on report
  `timing_complete: false` and are left out of solve times. Wall-clock time is
  recorded separately. Navigation interval is SHOW ME THE WAY to "I'm there", not a
  measured walk.
- **Dev builds** send `app_version` ending in `-dev` and are stored as test events,
  excluded from every metric.

## Metrics

All metric functions are in [`db/analytics.sql`](../db/analytics.sql) and take a
window and optional content version, so you can query them directly:

```sql
select * from analytics_quest_performance(now() - interval '30 days', now(), null);
select * from analytics_funnel('2026-11-01', '2026-12-01', '2026.10.22-1');
select * from analytics_age_groups(now() - interval '90 days', now(), null, 10);
```

`analytics_overview`, `analytics_funnel`, `analytics_quest_performance`,
`analytics_verification`, `analytics_routes`, `analytics_early_exits`,
`analytics_age_groups`, and the per-adventure `analytics_adventures`. Definitions
follow spec section 8; notes:

- Funnel and overview are cohorts of adventures that sent `adventure_started` in
  the window, followed to their latest event. Adventures already running when
  analytics was turned on have no start event and aren't counted there.
- First-attempt verification rate counts attempt 1 only when it reached the
  checker; transport failures (offline, timeout, unavailable, rate limited,
  rejected) are reported separately.
- Solve times are solved quests only; read them with exposures and skips.
- The dashboard shows rates only when the denominator is at least 10, and hides
  age groups with fewer than `ANALYTICS_MIN_COHORT` adventures.

## Dashboard

`/admin`: aggregates only, HTTP Basic auth over HTTPS, no scripts, not cached by
the service worker. Filters: date range and content version. The CSV export is
the aggregated quest table only; there's no way to export individual events from
the UI. Every view and export is logged to `analytics_admin_audit` and the server
log, as are failed sign-ins.

## Retention and deletion

- Events are deleted `ANALYTICS_RETENTION_DAYS` (default 180) after the server
  received them. The job runs at server start and daily. Audit rows are kept 400 days.
- On the phone, turning analytics off deletes queued events and timers at once.
- Server-side deletion for one child isn't possible by design: nothing ties an
  adventure id to a person, and the phone doesn't show it. We don't promise
  per-child deletion; data expires on schedule. To delete everything:
  `truncate analytics_events;`.
- Backups: Neon keeps point-in-time history for its retention window (7 days on
  the free tier). Deleted data can persist in backups for that long.

## Incidents

If the database or admin password may have been exposed: rotate `ADMIN_PASSWORD`
and the database password (`fly secrets set …`), review `analytics_admin_audit`,
and assess what was reachable. Event rows hold no contact details or photos, so a
breach exposes game statistics, broad age groups and random ids. Record what
happened and when, and ask counsel whether notification rules apply.

## Changing content

See [content-versions.md](content-versions.md). Don't change a riddle because of
a single metric: check for the artwork moving, crowds, closures, signal, camera
quality and model changes first, then get the owner's approval, publish a new
version, and compare cohorts.

## Not built yet (spec phase 3)

Quality alerts, version-comparison charts, an editorial review workflow, and A/B
tests (which would also need a separate privacy review).
