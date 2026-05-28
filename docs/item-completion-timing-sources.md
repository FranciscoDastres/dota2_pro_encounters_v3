# Item Completion Timing Sources

Last checked: 2026-05-27

This project needs two different item timing concepts:

- **Exact match timing**: when this player completed or bought an item in a specific match.
- **Benchmark timing**: when players usually complete an item for a hero, used as a target.

## Primary Source: OpenDota Match Details

Endpoint:

```text
GET https://api.opendota.com/api/matches/{matchId}
```

Relevant player fields:

- `players[].purchase_log[]`
- `purchase_log[].time`: in-game time in seconds
- `purchase_log[].key`: OpenDota/dotaconstants item key
- `item_0` through `item_5`, `backpack_0` through `backpack_2`: final inventory snapshot

OpenDota documents its API as replay-derived advanced match data, and its OpenAPI schema describes `purchase_log` as the data for when items were purchased. This is the best source for an exact timing in this app because it is already tied to the selected `match_id`, account, and player slot.

Implementation rule:

- If `purchase_log` contains the final item key, use that time as the exact completed timing.
- If `purchase_log` does not contain the final item key, but the final inventory contains that item and dotaconstants lists its top-level components, estimate completion as the latest registered component purchase time.
- If the match only has final inventory and no useful `purchase_log`, do not invent a timing. Show it as unavailable.

## Item Metadata And Components: dotaconstants

Endpoint currently used by the backend:

```text
GET https://unpkg.com/dotaconstants@10.8.0/build/items.json
```

Relevant item fields:

- `id`: numeric item ID used by final inventory slots
- `dname`: display name
- `img`: icon path
- `abilities`, `attrib`, `notes`, `lore`: hover description inputs
- `components`: top-level component keys used for completion-time estimation

This data should not be treated as a match source. It is static metadata used to resolve item names, icons, descriptions, and component relationships.

## Benchmark Source: OpenDota Scenario Item Timings

Endpoint:

```text
GET https://api.opendota.com/api/scenarios/itemTimings
```

Fields include:

- `hero_id`
- `item`
- `time`
- `games`
- `wins`

This endpoint is useful for pro/hero timing targets, not for exact timing in one match. It returns aggregate buckets across many games, so it should not replace `purchase_log` for the player's selected match.

## STRATZ

STRATZ advertises a GraphQL API and detailed parsed match data, so it is a possible future source for richer item history. Anonymous backend calls to `https://api.stratz.com/graphql` currently receive a Cloudflare `403` challenge, so this app should not depend on STRATZ until we have a supported API token/access path and a tested GraphQL query.

Recommended future integration:

- Add `STRATZ_API_TOKEN` only on the backend.
- Add a STRATZ service behind the same comparison service boundary.
- Use STRATZ only as a fallback when OpenDota has no parsed `purchase_log`.
- Mark STRATZ timings with their source in the API response, the same way OpenDota and inferred timings are marked.

## Current UI Contract

Each core item timing includes:

- `completedMinute`: exact or estimated completion minute, or `null`
- `timingSource`: `purchase_log`, `component_inference`, or `unavailable`
- `userMinute`: kept for backward compatibility and currently mirrors `completedMinute`
- `proMinute`: benchmark target minute
- `status`: `on_time`, `late`, `missing`, or `snapshot`

The hover text should say:

- `Completado` for exact OpenDota `purchase_log`
- `Completado estimado` for component-based inference
- `Timing de completado no disponible` when only snapshot data exists
