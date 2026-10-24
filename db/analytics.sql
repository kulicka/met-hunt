-- Hidden Treasures analytics: schema, metric functions, retention.
-- Applied automatically at server start (idempotent), or by hand:
--   psql "$DATABASE_URL" -f db/analytics.sql
--
-- Privacy: no IP address, user agent, name, photo, location or free text is
-- stored. adventure_id is random and changes with every new adventure.
-- Every metric function excludes test events and takes a window
-- [p_from, p_to) on occurred_at, plus an optional content pack version.

create table if not exists analytics_events (
  event_id                    uuid primary key,          -- client UUID: retries and offline replays dedupe here
  event_name                  text        not null,
  schema_version              smallint    not null,
  occurred_at                 timestamptz not null,      -- client clock
  received_at                 timestamptz not null default now(),  -- server clock
  adventure_id                uuid        not null,
  session_id                  uuid        not null,
  app_version                 text        not null,
  content_pack_version        text        not null,
  quest_id                    text,
  gallery_id                  smallint,
  artwork_id                  text,
  hidden_detail_id            text,
  riddle_version              text,
  hint_set_version            text,
  artwork_assignment_version  text,
  properties                  jsonb       not null default '{}'::jsonb,
  is_test                     boolean     not null default false
);

create index if not exists analytics_events_name_time on analytics_events (event_name, occurred_at);
create index if not exists analytics_events_adventure on analytics_events (adventure_id);
create index if not exists analytics_events_received on analytics_events (received_at);

-- Who opened the dashboard or an export, and when. No event data is copied here.
create table if not exists analytics_admin_audit (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  admin_user text        not null,
  action     text        not null,   -- 'view_dashboard' | 'export_csv' | 'denied'
  detail     text
);

-- Immutable record of published content versions (spec section 7). Rows are
-- added by the server at start from each adventure's versions.ts (src/adventures/*/versions.ts).
create table if not exists analytics_content_versions (
  content_pack_version        text not null,
  quest_id                    text not null,
  gallery_id                  smallint not null,
  artwork_id                  text not null,
  hidden_detail_id            text not null,
  riddle_version              text not null,
  hint_set_version            text not null,
  artwork_assignment_version  text not null,
  riddle_fingerprint          text not null,
  hints_fingerprint           text not null,
  first_seen                  timestamptz not null default now(),
  primary key (content_pack_version, quest_id)
);

-- Which adventure (src/adventures/registry.ts) an event or content version
-- belongs to. Added when adventures became pluggable; everything recorded
-- before that was the first adventure, European Paintings. Content pack
-- versions are unique across adventures, so the p_content filter below also
-- picks out one adventure.
alter table analytics_events add column if not exists pack_id text not null default 'european-paintings';
alter table analytics_content_versions add column if not exists pack_id text not null default 'european-paintings';
create index if not exists analytics_events_pack on analytics_events (pack_id, occurred_at);

-- Events in a window, test events excluded.
create or replace function analytics_window(p_from timestamptz, p_to timestamptz, p_content text default null)
returns setof analytics_events language sql stable as $$
  select * from analytics_events
  where not is_test
    and occurred_at >= p_from and occurred_at < p_to
    and (p_content is null or content_pack_version = p_content)
$$;

-- One row per adventure that started in the window. Later events of those
-- adventures count even after p_to, so an adventure isn't cut in half.
create or replace function analytics_adventures(p_from timestamptz, p_to timestamptz, p_content text default null)
returns table (
  adventure_id uuid, started_at timestamptz, content_pack_version text, age_bucket text,
  quests_completed int, completed boolean, ended_early boolean, restarted boolean, last_event_at timestamptz
) language sql stable as $$
  with started as (
    select adventure_id, min(occurred_at) as started_at,
           min(content_pack_version) as content_pack_version,
           min(properties->>'age_bucket') as age_bucket
    from analytics_window(p_from, p_to, p_content)
    where event_name = 'adventure_started'
    group by adventure_id
  )
  select s.adventure_id, s.started_at, s.content_pack_version, s.age_bucket,
         (count(distinct e.quest_id) filter (where e.event_name = 'quest_completed'))::int,
         bool_or(e.event_name = 'adventure_completed'),
         -- ended early and never resumed afterwards
         coalesce(max(e.occurred_at) filter (where e.event_name = 'adventure_ended_early')
                  > coalesce(max(e.occurred_at) filter (where e.event_name = 'adventure_resumed' and e.properties->>'from' = 'ended_early'), '-infinity'), false),
         bool_or(e.event_name = 'adventure_restart_confirmed'),
         max(e.occurred_at)
  from started s
  join analytics_events e on e.adventure_id = s.adventure_id and not e.is_test
  group by s.adventure_id, s.started_at, s.content_pack_version, s.age_bucket
$$;

create or replace function analytics_overview(p_from timestamptz, p_to timestamptz, p_content text default null)
returns table (
  content_pack_version text, consented_adventures bigint, starts bigint, completions bigint,
  ended_early bigint, restarted bigint, still_open bigint, median_quests_completed numeric
) language sql stable as $$
  with consented as (
    select content_pack_version, count(distinct adventure_id) as n
    from analytics_window(p_from, p_to, p_content) group by 1
  )
  select a.content_pack_version,
         coalesce(max(c.n), 0),
         count(*),
         count(*) filter (where a.completed),
         count(*) filter (where a.ended_early and not a.completed),
         count(*) filter (where a.restarted and not a.completed),
         count(*) filter (where not a.completed and not a.ended_early and not a.restarted),
         percentile_cont(0.5) within group (order by a.quests_completed)::numeric
  from analytics_adventures(p_from, p_to, p_content) a
  left join consented c using (content_pack_version)
  group by a.content_pack_version
  order by a.content_pack_version
$$;

-- Funnel over adventures started in the window.
create or replace function analytics_funnel(p_from timestamptz, p_to timestamptz, p_content text default null)
returns table (step text, step_order int, adventures bigint, completed bigint, ended_early bigint, restarted bigint, still_open bigint)
language sql stable as $$
  with a as (select * from analytics_adventures(p_from, p_to, p_content)),
  -- The last step is a finished hunt, whatever its length (10 stops, or 14 with the Egyptian Daily Life stops).
  steps(step, step_order, min_quests) as (values ('started', 0, 0), ('1+ quests', 1, 1), ('3+ quests', 2, 3), ('6+ quests', 3, 6), ('all quests', 4, null::int))
  select s.step, s.step_order, count(a.adventure_id),
         count(a.adventure_id) filter (where a.completed),
         count(a.adventure_id) filter (where a.ended_early and not a.completed),
         count(a.adventure_id) filter (where a.restarted and not a.completed),
         count(a.adventure_id) filter (where not a.completed and not a.ended_early and not a.restarted)
  from steps s left join a on (s.min_quests is null and a.completed) or a.quests_completed >= s.min_quests
  group by s.step, s.step_order
  order by s.step_order
$$;

-- Quest performance by content version (spec section 8). Rates are left to the
-- reader so every number comes with its denominator.
create or replace function analytics_quest_performance(p_from timestamptz, p_to timestamptz, p_content text default null)
returns table (
  quest_id text, gallery_id smallint, artwork_id text, riddle_version text, hint_set_version text, artwork_assignment_version text,
  exposures bigint, completions bigint, completions_ai bigint, completions_parent bigint,
  hint_adventures bigint, hint2_adventures bigint,
  photo_adventures bigint, retry_adventures bigint,
  first_attempts bigint, first_attempts_verified bigint, transport_errors bigint,
  results_uncertain bigint, results_not_found bigint,
  skips_user bigint, skips_closed bigint,
  timed_solves bigint, active_p25_ms numeric, active_median_ms numeric, active_p75_ms numeric
) language sql stable as $$
  with w as (select * from analytics_window(p_from, p_to, p_content) where quest_id is not null),
  photos as (
    select quest_id, riddle_version, hint_set_version, artwork_assignment_version, adventure_id, count(*) as n
    from w where event_name = 'quest_photo_submitted' group by 1, 2, 3, 4, 5
  ),
  photo_stats as (
    select quest_id, riddle_version, hint_set_version, artwork_assignment_version,
           count(*) as photo_adventures, count(*) filter (where n > 1) as retry_adventures
    from photos group by 1, 2, 3, 4
  )
  select w.quest_id, min(w.gallery_id), min(w.artwork_id), w.riddle_version, w.hint_set_version, w.artwork_assignment_version,
    count(distinct w.adventure_id) filter (where event_name = 'quest_viewed'),
    count(distinct w.adventure_id) filter (where event_name = 'quest_completed'),
    count(distinct w.adventure_id) filter (where event_name = 'quest_completed' and properties->>'method' = 'ai_verified'),
    count(distinct w.adventure_id) filter (where event_name = 'quest_completed' and properties->>'method' = 'parent_confirmed'),
    count(distinct w.adventure_id) filter (where event_name = 'quest_hint_opened'),
    count(distinct w.adventure_id) filter (where event_name = 'quest_hint_opened' and properties->>'hint_level' = '2'),
    coalesce(max(p.photo_adventures), 0),
    coalesce(max(p.retry_adventures), 0),
    -- First eligible submissions: attempt 1 that reached the checker (transport failures reported separately).
    count(*) filter (where event_name = 'quest_verification_result' and properties->>'attempt_number' = '1' and properties->>'error_kind' = 'none'),
    count(*) filter (where event_name = 'quest_verification_result' and properties->>'attempt_number' = '1' and properties->>'error_kind' = 'none' and properties->>'result' = 'verified'),
    count(*) filter (where event_name = 'quest_verification_result' and properties->>'result' = 'error'),
    count(*) filter (where event_name = 'quest_verification_result' and properties->>'result' in ('uncertain', 'likely')),
    count(*) filter (where event_name = 'quest_verification_result' and properties->>'result' = 'not_found'),
    count(distinct w.adventure_id) filter (where event_name = 'quest_skipped' and properties->>'reason' = 'user_switched'),
    count(distinct w.adventure_id) filter (where event_name = 'quest_skipped' and properties->>'reason' = 'closed'),
    count(*) filter (where event_name = 'quest_completed' and (properties->>'timing_complete')::boolean and properties->>'active_ms' is not null),
    (percentile_cont(0.25) within group (order by (properties->>'active_ms')::numeric) filter (where event_name = 'quest_completed' and (properties->>'timing_complete')::boolean))::numeric,
    (percentile_cont(0.5)  within group (order by (properties->>'active_ms')::numeric) filter (where event_name = 'quest_completed' and (properties->>'timing_complete')::boolean))::numeric,
    (percentile_cont(0.75) within group (order by (properties->>'active_ms')::numeric) filter (where event_name = 'quest_completed' and (properties->>'timing_complete')::boolean))::numeric
  from w
  left join photo_stats p using (quest_id, riddle_version, hint_set_version, artwork_assignment_version)
  group by w.quest_id, w.riddle_version, w.hint_set_version, w.artwork_assignment_version
  order by w.quest_id, w.riddle_version, w.hint_set_version, w.artwork_assignment_version
$$;

-- Photo check diagnostics by verification model.
create or replace function analytics_verification(p_from timestamptz, p_to timestamptz, p_content text default null)
returns table (
  model_version text, results bigint, verified bigint, likely bigint, not_found bigint, uncertain bigint, invalid_image bigint,
  errors bigint, error_offline bigint, error_timeout bigint, error_unavailable bigint, error_rate_limited bigint, error_rejected bigint,
  latency_p50_bucket text, latency_p95_bucket text
) language sql stable as $$
  with r as (
    select coalesce(properties->>'model_version', '(none)') as model_version, properties->>'result' as result,
           properties->>'error_kind' as error_kind, properties->>'latency_bucket' as bucket,
           array_position(array['lt2s', '2-5s', '5-10s', '10-20s', 'gte20s'], properties->>'latency_bucket') as bucket_order
    from analytics_window(p_from, p_to, p_content)
    where event_name = 'quest_verification_result'
  ),
  ranked as (
    select r.*, cume_dist() over (partition by model_version order by bucket_order) as cd
    from r where error_kind = 'none'
  )
  select m.model_version, count(*),
    count(*) filter (where result = 'verified'), count(*) filter (where result = 'likely'),
    count(*) filter (where result = 'not_found'), count(*) filter (where result = 'uncertain'),
    count(*) filter (where result = 'invalid_image'), count(*) filter (where result = 'error'),
    count(*) filter (where error_kind = 'offline'), count(*) filter (where error_kind = 'timeout'),
    count(*) filter (where error_kind = 'unavailable'), count(*) filter (where error_kind = 'rate_limited'),
    count(*) filter (where error_kind = 'rejected'),
    (select bucket from ranked k where k.model_version = m.model_version and k.cd >= 0.5 order by k.bucket_order limit 1),
    (select bucket from ranked k where k.model_version = m.model_version and k.cd >= 0.95 order by k.bucket_order limit 1)
  from r m
  group by m.model_version
  order by count(*) desc
$$;

-- Navigation diagnostics: requested routes, and how often no verified open route existed.
create or replace function analytics_routes(p_from timestamptz, p_to timestamptz, p_content text default null)
returns table (
  from_gallery int, to_gallery int, route_graph_version text, closure_version text,
  requests bigint, unavailable_no_route bigint, unavailable_closure bigint, arrivals_after bigint, navigation_median_ms numeric
) language sql stable as $$
  with w as (select * from analytics_window(p_from, p_to, p_content)),
  req as (
    select (properties->>'from_gallery')::int as from_gallery, (properties->>'to_gallery')::int as to_gallery,
           properties->>'route_graph_version' as route_graph_version, properties->>'closure_version' as closure_version,
           event_name, properties->>'reason' as reason
    from w where event_name in ('route_requested', 'route_unavailable')
  ),
  arr as (
    select gallery_id::int as to_gallery, count(*) as n,
           percentile_cont(0.5) within group (order by (properties->>'navigation_ms')::numeric) as med
    from w where event_name = 'quest_arrival_confirmed' and properties->>'navigation_ms' is not null
    group by 1
  )
  select q.from_gallery, q.to_gallery, q.route_graph_version, q.closure_version,
    count(*) filter (where q.event_name = 'route_requested'),
    count(*) filter (where q.event_name = 'route_unavailable' and q.reason = 'no_verified_route'),
    count(*) filter (where q.event_name = 'route_unavailable' and q.reason = 'closure_blocking'),
    max(a.n), max(a.med)::numeric
  from req q left join arr a using (to_gallery)
  group by 1, 2, 3, 4
  order by 1, 2, 3, 4
$$;

-- Where adventures ended early (the quest on screen at the time; not proof of cause).
create or replace function analytics_early_exits(p_from timestamptz, p_to timestamptz, p_content text default null)
returns table (current_quest_id text, completed_count int, adventures bigint)
language sql stable as $$
  select properties->>'current_quest_id', (properties->>'completed_count')::int, count(distinct adventure_id)
  from analytics_window(p_from, p_to, p_content)
  where event_name = 'adventure_ended_early'
  group by 1, 2 order by 1, 2
$$;

-- Age-group comparison with small-cohort suppression (spec 13.11).
create or replace function analytics_age_groups(p_from timestamptz, p_to timestamptz, p_content text default null, p_min_cohort int default 10)
returns table (age_bucket text, adventures bigint, suppressed boolean, completed bigint, median_quests_completed numeric)
language sql stable as $$
  with g as (
    select coalesce(age_bucket, 'unknown') as age_bucket, count(*) as n,
           count(*) filter (where completed) as completed,
           percentile_cont(0.5) within group (order by quests_completed)::numeric as med
    from analytics_adventures(p_from, p_to, p_content) group by 1
  )
  select age_bucket,
         case when n >= p_min_cohort then n end,
         n < p_min_cohort,
         case when n >= p_min_cohort then completed end,
         case when n >= p_min_cohort then med end
  from g order by age_bucket
$$;

-- Retention: delete events older than p_days (by server receive time), and old audit rows.
create or replace function analytics_purge(p_days int, p_audit_days int default 400)
returns bigint language plpgsql as $$
declare n bigint;
begin
  delete from analytics_events where received_at < now() - make_interval(days => p_days);
  get diagnostics n = row_count;
  delete from analytics_admin_audit where at < now() - make_interval(days => p_audit_days);
  return n;
end $$;
