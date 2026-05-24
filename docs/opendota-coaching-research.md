# OpenDota Coaching Research

Last researched: 2026-05-24

This file is a reusable research note for future Codex sessions. Load it before
designing OpenDota-backed coaching features so the API does not need to be
re-investigated from scratch.

## Executive Summary

OpenDota is strong for post-match analysis, player history, hero pool trends,
benchmarks, professional-player context, and draft/matchup research. It is not a
true real-time telemetry API for every active match.

The best product direction for this repo is not just "more stats". The strongest
coaching value is to translate match data into clear actions:

- What happened in the last match?
- Which role expectation did the player miss?
- What should the player practice next?
- Which heroes should the player keep, bench, or learn?
- How does the player's timing/impact compare against high-percentile players?

The current repo already has a good starting point: `carry-comparison` fetches a
match, validates OpenDota responses, compares metrics against hero benchmarks,
builds item timing feedback, and renders a frontend coaching panel.

## Sources Used

- OpenDota OpenAPI spec: https://api.opendota.com/api
- OpenDota API docs shell: https://docs.opendota.com/
- OpenDota API keys page: https://www.opendota.com/api-keys
- OpenDota core repository: https://github.com/odota/core
- OpenDota FAQ: https://blog.opendota.com/2014/08/01/faq/
- OpenDota API change/rate-limit blog: https://blog.opendota.com/2018/04/17/changes-to-the-api/
- Live endpoint sample: https://api.opendota.com/api/live

Observed spec version during research: OpenAPI `3.0.3`, OpenDota API version
`31.1.0`.

## Real-Time And Live-Match Capability

Question: can the API give online or real-time results for a new match currently
being played by a specific account?

Short answer: only partially, and not reliably for every user.

What exists:

- `GET /live` returns top currently ongoing live games.
- Live game objects include fields like `match_id`, `game_time`, `spectators`,
  `radiant_score`, `dire_score`, `radiant_lead`, `last_update_time`, and
  `players`.
- Each live `players` entry includes `account_id`, `hero_id`, `team`, and
  `team_slot`.
- A backend can poll `/live`, search `players[].account_id`, and detect whether
  a target account appears in that feed.

What does not exist:

- There is no documented `GET /live/:accountId`.
- There is no documented player-specific active-match endpoint.
- `/players/{account_id}/matches` and `/players/{account_id}/recentMatches`
  are historical/post-match surfaces, not live telemetry.
- `/matches/{match_id}` is a post-match parsed-match endpoint. It is not a
  second-by-second live match state endpoint.

Product implication:

- A "Live now?" badge can be attempted by polling `/live`, but label it as
  "detected in OpenDota live feed", not as guaranteed online status.
- It may work for high-MMR, high-spectator, or otherwise surfaced live games.
  It should not be treated as complete coverage for ordinary public matches.
- For true local real-time coaching while the user is playing, OpenDota is the
  wrong primary source. That would require another source such as local Dota 2
  Game State Integration or a direct Game Coordinator/Steam path, with different
  privacy and operational constraints.

## Local Dota 2 Game State Integration

This is separate from OpenDota. Game State Integration (GSI) is a local Dota 2
client feature: the game sends HTTP POST requests with JSON game-state payloads
to a URI configured on the player's machine.

Useful sources:

- Valve GSI mechanics documented for Source games:
  https://developer.valvesoftware.com/wiki/Counter-Strike%3A_Global_Offensive_Game_State_Integration
- Dota 2 C# GSI library and Dota-specific notes:
  https://github.com/antonpup/Dota2GSI
- Dota 2 Rust GSI docs with config example:
  https://docs.rs/dota-gsi/latest/dota/

How it works:

- The user enables Dota with the `-gamestateintegration` launch option.
- The user creates a config file named like
  `gamestate_integration_stomptracker.cfg`.
- The config points Dota to a local listener, usually
  `http://127.0.0.1:<port>/`.
- A local service listens for POST requests and returns HTTP 2XX quickly.
- Dota sends full and delta state payloads according to config settings such as
  `buffer`, `throttle`, `heartbeat`, and selected `data` blocks.
- Optional `auth` config values are transmitted in the JSON payload and should
  be checked by the listener.

Typical config shape:

```cfg
"StompTracker GSI"
{
  "uri"       "http://127.0.0.1:4010/gsi"
  "timeout"   "5.0"
  "buffer"    "0.1"
  "throttle"  "0.5"
  "heartbeat" "5.0"
  "data"
  {
    "provider"     "1"
    "map"          "1"
    "player"       "1"
    "hero"         "1"
    "abilities"    "1"
    "items"        "1"
    "draft"        "1"
    "buildings"    "1"
    "events"       "1"
    "minimap"      "1"
    "roshan"       "1"
    "neutralitems" "1"
  }
  "auth"
  {
    "token" "replace-with-random-local-token"
  }
}
```

Expected config location:

- Windows:
  `Steam\steamapps\common\dota 2 beta\game\dota\cfg\gamestate_integration\`
- Linux:
  `~/.steam/steam/steamapps/common/dota 2 beta/game/dota/cfg/gamestate_integration/`

Important limitations:

- This requires the user's local Dota 2 client. A hosted website cannot simply
  query GSI for any player.
- For a web product, the practical architecture is a local companion service or
  desktop app that forwards sanitized data to the web app after explicit user
  consent.
- When playing, GSI is mainly personal/local-player data. It can expose the
  local player's hero, items, abilities, gold, KDA, last hits, denies, team,
  player slot, and map-level state such as clock, score, pause state, Roshan or
  buildings if those data blocks are enabled.
- When playing, do not assume GSI exposes private enemy/teammate details such as
  every player's inventory, cooldowns, economy, exact position, or hidden
  information. Design live coaching around the local player plus safe public or
  map-level state.
- When spectating/observing a match, GSI can expose data for all players and
  heroes in the match. This is why it is useful for broadcast overlays and
  observer tools, but that visibility should not be treated as available while
  the user is actively playing.
- GSI is not a replay parser and is not a replacement for OpenDota post-match
  data. It is best for live overlays, local live coaching cues, and detecting
  current match state from the player's own machine.
- Keep the endpoint local by default. If forwarding to a remote backend, use
  user auth, TLS, rate limiting, consent copy, and a minimized payload.

Possible architecture for this repo:

- Add a small local Node service:
  - listens on `127.0.0.1:4010/gsi`,
  - validates the `auth.token`,
  - normalizes GSI payloads into a small internal schema,
  - broadcasts updates to the frontend with WebSocket or Server-Sent Events.
- Keep OpenDota as the authoritative post-match analysis source.
- Use GSI only for "live local session" features, for example:
  - current hero, match clock, KDA, gold, items, cooldown-aware checklist,
  - last-hit pace vs target,
  - warning if deaths happen before planned item timing,
  - live overlay for stream/spectator use,
  - automatic handoff to OpenDota analysis once `match_id` is available and the
    match has ended/been parsed.

## API Limits And Data Reliability

Important constraints:

- OpenDota can be used without an API key, but the official spec says an API key
  increases rate limits and usage.
- The 2018 OpenDota blog announced a free tier of 50,000 API calls per month.
  Treat exact quota numbers as plan-dependent and check the current API keys
  page before production launch.
- Live response headers observed during research exposed remaining minute/day
  counters, so the backend should continue to cache and rate-limit aggressively.
- `POST /request/{match_id}` submits a parse request and the spec says it counts
  as 10 calls for rate-limit purposes.
- OpenDota data comes from Steam WebAPI plus replay parsing. Basic data exists
  for public matches, while advanced parsed replay data exists only for a subset
  of matches.
- Dota 2's "Expose Public Match Data" setting matters. Users who do not expose
  public match data can appear anonymous in future matches.
- Advanced match data can take minutes after a match and may be missing if the
  replay cannot be fetched, the replay expired, or Steam/GC services have
  issues.

Architecture implication:

- Keep OpenDota access server-side.
- Use Zod validation at the backend boundary and frontend boundary.
- Cache expensive and repeated calls.
- Surface confidence/availability in the UI instead of implying every match has
  full parsed telemetry.

## Endpoint Map For Coaching

### Player Identity And Progress

`GET /players/{account_id}`

Use for:

- Player profile header.
- Rank tier / leaderboard rank display.
- Alias history.
- Public profile and avatar.

Coaching ideas:

- "Current baseline" card: rank, last seen profile, leaderboard rank.
- "Identity confidence" when a user searched by name and selected an account.

`GET /players/{account_id}/ratings`

Use for:

- Rank history by match/time.
- Progression chart.

Coaching ideas:

- Medal trajectory.
- "Improving, flat, or falling" trend over recent ranked matches.
- Correlate rank changes with hero pool changes.

`POST /players/{account_id}/refresh`

Use for:

- Requesting OpenDota to refresh up to 500 player matches, medal/rank, and
  profile name.

Implementation caution:

- Put this behind a user action and backend rate limiter.
- Do not trigger it automatically on every page load.

### Match History

`GET /players/{account_id}/recentMatches`

Use for:

- Fast recent-match list.
- Entry point for "Analyze latest match".

Typical fields:

- `match_id`, `player_slot`, `radiant_win`, `hero_id`, `start_time`,
  `duration`, `game_mode`, `lobby_type`, `kills`, `deaths`, `assists`,
  `average_rank`, `xp_per_min`, `gold_per_min`, `hero_damage`, `tower_damage`,
  `hero_healing`, `last_hits`, `lane_role`, `party_size`.

Coaching ideas:

- Recent form strip: last 20 matches, win/loss, KDA, hero, role.
- "Pick one match to review" UX.
- Detect obvious outliers: very low GPM, high deaths, low tower damage, unusual
  game duration, abandon/leaver status.

`GET /players/{account_id}/matches`

Use for:

- Filtered history and deeper queries.
- Supports filters such as `limit`, `offset`, `win`, `patch`, `game_mode`,
  `lobby_type`, `region`, `date`, `lane_role`, `hero_id`, `is_radiant`,
  `included_account_id`, `excluded_account_id`, `with_hero_id`,
  `against_hero_id`, `significant`, `having`, `sort`, and `project`.

Coaching ideas:

- Last 30 days by role.
- Hero-specific match history.
- "How do I perform against Pudge/Invoker/Spirit heroes?"
- Patch-filtered performance.
- Party vs solo performance.
- Ranked-only analysis by `lobby_type`.

### Full Match Review

`GET /matches/{match_id}`

Use for:

- Main post-match coach review.
- Parsed match details.

Useful match-level fields:

- `duration`, `start_time`, `radiant_win`, `radiant_score`, `dire_score`.
- `picks_bans` and `draft_timings`.
- `radiant_gold_adv`, `radiant_xp_adv`.
- `objectives`.
- `teamfights`.
- `players`.

Useful player-level fields:

- Core stats: `kills`, `deaths`, `assists`, `gold_per_min`, `xp_per_min`,
  `last_hits`, `denies`, `level`, `net_worth`, `hero_damage`,
  `tower_damage`, `hero_healing`.
- Timelines: `gold_t`, `xp_t`, `lh_t`, `dn_t`.
- Items: `purchase`, `purchase_log`, `item_0` through `item_5`,
  backpack slots, neutral item fields.
- Abilities: `ability_upgrades_arr`, `ability_uses`, `ability_targets`.
- Fighting: `damage`, `damage_targets`, `damage_taken`, `killed`,
  `killed_by`, `kills_log`, `max_hero_hit`.
- Support/vision: `obs_placed`, `sen_placed`, `obs_log`, `sen_log`,
  `camps_stacked`, `creeps_stacked`, `runes_log`.
- Discipline: `deaths_log`, `buyback_log`, `connection_log`, `pings`.

Coaching ideas:

- Post-match debrief:
  - lane/early game,
  - farming curve,
  - death timing,
  - item timings,
  - objective contribution,
  - fight participation,
  - support vision/stacks,
  - final practice prescription.
- Comeback/stomp detection using early deaths and gold/xp advantage curves.
- "The 3 biggest leaks" summary, based on the largest gaps from benchmark.
- Timeline cards:
  - "Minute 10: expected X, you had Y",
  - "First death before key timing",
  - "BKB delayed by N minutes",
  - "No tower damage before minute 20".

### Item Constants And Icons

`GET /constants/items`

Use for:

- Mapping OpenDota item keys and numeric item IDs to display names and icons.
- Tooltips/descriptions for item timing cards and inventory snapshots.
- Canonicalizing item aliases used in local timing constants or purchase logs.

Observed useful fields on 2026-05-24:

- `id`: numeric item ID used in final inventory slots such as `item_0` through
  `item_5`, backpack slots, and neutral item fields.
- `dname`: display name, for example `Black King Bar`.
- `img`: relative image path, for example
  `/apps/dota2/images/dota_react/items/blink.png?t=1593393829403`.
- `abilities[]`: each entry can include `title` and `description`; use the
  first meaningful description for hover text.
- `attrib[]`: item stat rows, often with `display` and `value`.
- `notes` and `lore`: optional extra text; useful as lower-priority tooltip
  context.

Icon handling:

- Prefer `img` from `/constants/items` when available. It is already the exact
  current asset path, including cache-busting query params.
- Prefix the relative `img` path with
  `https://cdn.cloudflare.steamstatic.com` for the primary CDN URL.
- Frontend fallback URLs should also try
  `https://api.opendota.com/apps/dota2/images/dota_react/items/{itemKey}.png`
  and the legacy `{itemKey}_lg.png` path because some item keys or local timing
  aliases can drift from the current constants table.
- Keep aliases centralized. Current known aliases:
  - `battle_fury` and `battlefury` should resolve to `bfury`.
  - `shadow_blade` and repo-local `shadow_sb` should resolve to `invis_sword`.

Implementation notes for this repo:

- `backend/src/services/dotaConstants.service.ts` should build
  `ResolvedItemConstant` from `/constants/items`, including `iconUrl` and
  `description`.
- `backend/src/services/carryProgression.service.ts` should use constants by
  key for purchase logs and by numeric `id` for final inventory snapshots.
- `frontend/src/components/comparison/IconFrame.tsx` supports multiple image
  candidates through `fallbackSrcs`; use it for item icons instead of raw
  `<img>` when rendering coaching panels.

### Hero Pool And Role Development

`GET /players/{account_id}/heroes`

Use for:

- Hero pool summary.
- Games/wins by hero.
- `with_games`, `with_win`, `against_games`, `against_win` context.

Coaching ideas:

- Comfort picks vs trap picks:
  - high games, low winrate = review or bench,
  - low games, high winrate = candidate to expand,
  - high winrate in small sample = mark as tentative.
- Role pool:
  - infer preferred role by hero/lane_role from recent matches,
  - recommend 3-5 stable heroes per role.
- Hero mastery score:
  - volume,
  - winrate,
  - current patch,
  - benchmark proximity.

`GET /players/{account_id}/rankings`

Use for:

- Per-hero score/ranking context.

Coaching ideas:

- "Your best hero relative to global players".
- Hero specialization page.

`GET /benchmarks?hero_id={hero_id}`

Use for:

- Hero percentile comparisons.

Observed benchmark groups:

- `gold_per_min`
- `xp_per_min`
- `kills_per_min`
- `last_hits_per_min`
- `hero_damage_per_min`
- `hero_healing_per_min`
- `tower_damage`

Coaching ideas:

- Keep using percentile 95/99 comparison for core metrics.
- Add role-specific metric weights:
  - Position 1: GPM, LH/10, deaths before first core item, tower damage.
  - Position 2: XPM, kill participation, rune/fight timing, tower pressure.
  - Position 3: early deaths, initiation/objective participation, aura/blink
    timing, damage taken.
  - Position 4: assists, deaths, stacks, wards, smoke/objective timing when
    inferable.
  - Position 5: warding, sentries, deaths, save/healing, camps stacked, low-farm
    impact.

### Pro Context And Encounters

`GET /players/{account_id}/pros`

Use for:

- Existing "pros encountered" feature.
- With/against split and winrate context.

Coaching ideas:

- "Pro encounter replay review": if the user played with/against a known pro,
  analyze the user's performance in those matches.
- "What did the pro do differently on the same hero/role?"
- Confidence caution: do not overfit one match against a pro.

`GET /proPlayers`

Use for:

- Pro player catalog.
- Team/name/avatar metadata.

`GET /proMatches`

Use for:

- Recent pro match database.

Coaching ideas:

- Pro build inspiration, if connected to `/matches/{match_id}`.
- "Watchlist" for heroes the user wants to learn.

### Peers, Parties, And Social Coaching

`GET /players/{account_id}/peers`

Use for:

- Frequent teammates/opponents.
- Party or duo insights.

Coaching ideas:

- Duo synergy:
  - best teammate by winrate with enough games,
  - worst pairing,
  - best hero combinations with a frequent peer.
- "Stack health" dashboard:
  - who wins together,
  - who loses together,
  - role overlap problems.

### Draft, Meta, And Matchups

`GET /heroes`

Use for:

- Hero IDs, localized names, roles, attributes.

`GET /heroStats`

Use for:

- Current aggregate stats by hero.
- Includes pro picks/wins/bans and bracket fields such as `1_pick` through
  `8_pick` and `1_win` through `8_win`.

Coaching ideas:

- Hero recommendation by bracket:
  - "good in your bracket",
  - "good in pro play but bad for your bracket",
  - "popular but low winrate trap".

`GET /heroes/{hero_id}/matchups`

Use for:

- Hero-vs-hero matchup aggregate.

Coaching ideas:

- Counter explorer.
- "Bad matchup warning" after selecting a hero.
- Practice list: heroes that repeatedly beat the user's main picks.

`GET /heroes/{hero_id}/itemPopularity`

Use for:

- Common item buckets for a hero:
  - start-game items,
  - early-game items,
  - mid-game items,
  - late-game items.

Coaching ideas:

- Build sanity check.
- "Your first 3 items are unusual" warning.
- Starter item recommendations.

`GET /scenarios/itemTimings`

Use for:

- Aggregate item timing windows by hero/item.

Coaching ideas:

- Replace manual timing constants over time.
- Add dynamic benchmark source for key item timing feedback.
- Show "at this timing, winrate historically changes".

`GET /scenarios/laneRoles`

Use for:

- Hero lane role distributions.

Coaching ideas:

- Detect when a user is playing a hero in an unusual role.
- Recommend role expectations based on hero/lane distribution.

`GET /scenarios/misc`

Use for:

- Miscellaneous scenario aggregates.

Coaching ideas:

- Use later for specialized insights after inspecting scenario names and data
  shape.

### Public, Search, And Discovery

`GET /search?q={name}`

Use for:

- Account discovery by persona name.

Coaching ideas:

- Add search-by-name onboarding instead of requiring account ID.
- Let users confirm account via avatar/profile/last match time.

`GET /publicMatches`

Use for:

- Recent sampled public matches.
- Supports `less_than_match_id`, `min_rank`, `max_rank`.

Coaching ideas:

- Find high-rank examples for a hero.
- Build "recent Immortal examples" feed.

`GET /rankings?hero_id={hero_id}`

Use for:

- Top players by hero.

Coaching ideas:

- "Learn from specialists" list.
- Compare user's hero metrics to top specialists.

## Prioritized Feature Ideas

### 1. Automatic Post-Match Debrief

Value: highest.

User story:

- A player enters their account ID.
- The app finds recent matches.
- The player opens one match and gets a coach-style review.

Data:

- `recentMatches`
- `matches/{match_id}`
- `benchmarks`
- `heroes`
- `constants/items`
- `constants/abilities`
- `scenarios/itemTimings`

Output:

- Overall role score.
- Three biggest mistakes.
- One thing done well.
- Item timing verdict.
- Farming/impact curve.
- Death discipline.
- Role-specific practice drill.

Implementation fit:

- Extend `backend/src/services/carryComparison.service.ts` first.
- Then split role logic into the currently empty role service files:
  - `midComparison.service.ts`
  - `offlaneComparison.service.ts`
  - `supportComparison.service.ts`
  - `hardSupportComparison.service.ts`
  - `positionBase.service.ts`
- Reuse `frontend/src/components/CarryComparisonMatchPanel.tsx`.

### 2. Hero Pool Coach

Value: very high for casual and ranked players.

Data:

- `players/{account_id}/heroes`
- `players/{account_id}/matches`
- `players/{account_id}/rankings`
- `heroStats`
- `benchmarks`

Output:

- Main heroes.
- Trap heroes.
- Underrated heroes.
- Recommended role pool.
- "Play more / practice / bench" labels.

Implementation fit:

- New backend route: `GET /api/player-coach/:accountId/hero-pool`.
- New frontend panel under `PlayerProfile`.

### 3. Latest Match Watcher

Value: high and easy to understand.

Data:

- `players/{account_id}/recentMatches`
- Optional `players/{account_id}/refresh` behind explicit user action.

Output:

- "New match found since last visit."
- "Analyze latest match."
- "Refresh OpenDota history" button.

Implementation fit:

- Frontend stores last seen `match_id` in local storage.
- Backend route proxies recent matches and rate-limits refresh.

Realtime caution:

- This is post-match detection, not in-game realtime.

### 4. Live Detection Badge

Value: medium, but attractive.

Data:

- `live`

Output:

- "Possibly live now" if target account appears in `/live`.
- Show hero, team side, score, game time, spectators.

Implementation fit:

- New backend route: `GET /api/live-status/:accountId`.
- Poll every 60-120 seconds, not aggressively.
- Cache the whole `/live` response briefly.

Important UX wording:

- Use "detected in OpenDota live feed".
- Do not say "online" or "currently playing" as a guarantee.

### 5. Pro Encounter Coach Mode

Value: high for this app's existing identity.

Data:

- Existing `pro-encounters`.
- Existing `pro-matches`.
- `matches/{match_id}` for selected shared match.
- `benchmarks`.

Output:

- "Against this pro, you were ahead/behind on these timings."
- "When playing with this pro, your impact was higher/lower."
- "Replay review candidates" sorted by recency and data completeness.

Implementation fit:

- Add an "Analyze" action inside `MatchHistory`.
- Reuse the comparison endpoint/panel.

### 6. Draft And Counter Explorer

Value: high for competitive users, medium for casual.

Data:

- `heroes`
- `heroStats`
- `heroes/{hero_id}/matchups`
- `rankings`
- `publicMatches`

Output:

- Counter matrix.
- "Good in your bracket" vs "good in pro play".
- Hero-specific top-player examples.

Implementation fit:

- Separate route/page after core coaching features.

### 7. Duo / Party Synergy

Value: medium-high for stacks.

Data:

- `players/{account_id}/peers`
- `players/{account_id}/matches`
- `players/{account_id}/heroes`

Output:

- Best teammate by winrate with minimum sample.
- Worst pairing.
- Hero combinations that work.
- Party vs solo comparison.

Implementation fit:

- New "Squad" or "Duo" panel.
- Needs careful small-sample warnings.

## Recommended Implementation Roadmap

Phase 1: stabilize current coaching foundation.

- Keep `carry-comparison` as the initial endpoint name for compatibility, but
  internally rename concepts toward "role comparison".
- Move shared role detection, benchmark picking, item timing comparison, and
  metric construction into `positionBase.service.ts`.
- Fill the empty role service files one at a time.
- Add tests for role detection and role-specific metrics.

Phase 2: post-match debrief.

- Add structured coach findings:
  - `severity`
  - `category`
  - `title`
  - `evidence`
  - `recommendation`
  - `practice_drill`
- Keep raw OpenDota response out of the frontend.
- Add a frontend "Coach Summary" section above detailed metrics.

Phase 3: hero pool coach.

- Add a backend aggregation endpoint using `heroes`, `matches`, `rankings`, and
  `heroStats`.
- Show recommendations by role and confidence.
- Avoid recommending from samples below a minimum threshold unless labeled
  experimental.

Phase 4: live-status experiment.

- Add `GET /api/live-status/:accountId`.
- Poll `/live` server-side with short cache.
- Use conservative UI wording.
- Measure usefulness before making it a main feature.

## Repo-Specific Integration Notes

Current backend routes:

- `GET /api/pro-encounters/:accountId`
- `GET /api/pro-matches/:accountId/:proAccountId`
- `GET /api/carry-comparison/:accountId/:matchId/:heroId?percentile=95|99`
- `GET /api/health`
- `GET /api/health/deep`

Current backend OpenDota client:

- `backend/src/services/openDota.service.ts`
- Already has resilience through retry and a circuit breaker.
- Already wraps:
  - player pros,
  - shared matches,
  - latest player matches,
  - match details,
  - hero benchmarks,
  - heroes,
  - items,
  - ability constants,
  - dotaconstants ability IDs,
  - hero ability data.

Current frontend fit:

- `frontend/src/components/PlayerProfile.tsx` is the natural top-level place for
  player coaching modules.
- `frontend/src/components/CarryComparisonMatchPanel.tsx` is the primary coach
  panel currently mounted by the app.
- `frontend/src/components/CarryComparisonPanel.tsx` exists but appears to be an
  alternate/unmounted panel; consolidate later.
- `frontend/src/components/MatchHistory.tsx` can grow an "Analyze" action for
  shared pro matches.
- `frontend/src/services/api.ts` already validates OpenDota-derived backend
  responses with Zod. Keep that pattern.

Known repo opportunities:

- `backend/src/services/positionBase.service.ts` is empty.
- `backend/src/services/midComparison.service.ts` is empty.
- `backend/src/services/offlaneComparison.service.ts` is empty.
- `backend/src/services/supportComparison.service.ts` is empty.
- `backend/src/services/hardSupportComparison.service.ts` is empty.
- `supabase/migrations/003_create_pro_item_timings.sql` creates
  `pro_item_timings`, but the current code still mostly uses in-code item timing
  constants. This is a good future refactor target.

## Coaching Heuristics Worth Encoding

Use these as starting heuristics, not as final truth:

- Position 1:
  - primary: GPM, LH/10, core item timings, tower damage;
  - warnings: repeated early deaths, delayed farming item, low tower pressure.
- Position 2:
  - primary: XPM, GPM, kill participation, hero damage, rune/fight timing when
    inferable;
  - warnings: low XPM, no pressure, poor tower conversion.
- Position 3:
  - primary: deaths, initiation item timing, hero damage taken/dealt, objective
    pressure;
  - warnings: greedy item path, no teamfight impact, late blink/aura.
- Position 4:
  - primary: assists, early rotations, wards/sentries, stacks, deaths;
  - warnings: high farm with low impact, low participation, no vision.
- Position 5:
  - primary: wards/sentries, deaths, stacks, saves/healing if hero supports it,
    lane protection;
  - warnings: too many deaths before objective timings, low vision, no stacks.

Confidence rules:

- Label any insight based on fewer than 5 matches as low confidence.
- Separate "benchmark says" from "coach inference says".
- Avoid absolute blame. Phrase recommendations as next actions.
- Always show evidence: metric, minute, item timing, or match sample.

## Future Agent Instructions

When working on OpenDota/coaching features:

- Read this file first.
- Check whether the user asks for current API behavior. If yes, verify against
  `https://api.opendota.com/api` because the API can change.
- Keep OpenDota calls in backend services.
- Add Zod schemas for every new response shape.
- Cache list/detail endpoints before adding polling or bulk analysis.
- Do not add "real-time" wording unless the feature is explicitly based on
  `/live` and clearly marked as best-effort.
