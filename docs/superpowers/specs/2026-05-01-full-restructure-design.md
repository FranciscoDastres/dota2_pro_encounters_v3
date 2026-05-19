# StompTracker — Full Restructure Design

**Date:** 2026-05-01  
**Status:** Approved  
**Scope:** Monorepo migration, professional architecture (frontend + backend), new match comparison feature

---

## 1. Overview

Migrate StompTracker from a flat single-package SPA to a **pnpm workspaces monorepo** with three packages: `shared`, `backend`, `frontend`. Add a new match comparison feature at `/match/:matchId` that shows a side-by-side breakdown of the user's performance vs a pro player in a shared match (items, talents, skill build order).

**What does NOT change:** all existing data-fetching logic, Zod validation approach, Tailwind v4 color palette, component behavior, and test coverage. This is a structural migration + feature addition, not a rewrite.

---

## 2. Monorepo Structure

```
dota2_pro_encounters_v2/
├── packages/
│   ├── shared/                  ← Zod schemas + TS types (used by both)
│   ├── backend/                 ← Express API
│   └── frontend/                ← React 19 + Vite
├── pnpm-workspace.yaml
├── package.json                 ← root scripts
└── tsconfig.base.json           ← shared TS config
```

**Root `package.json` scripts:**
```json
{
  "scripts": {
    "dev":   "pnpm --parallel -r run dev",
    "build": "pnpm -r run build",
    "test":  "pnpm -r run test",
    "lint":  "pnpm -r run lint"
  }
}
```

**Dependency rule:** `frontend` → `shared` ← `backend`. Frontend and backend never import from each other — only from `shared`.

---

## 3. Package: `shared`

Single source of truth for all types that cross the network boundary.

```
packages/shared/src/
├── schemas/
│   ├── player.schema.ts      ← PlayerProfile, HeroStat, RecentMatch
│   ├── pro.schema.ts         ← ProEncounter, ProEncountersResponse
│   ├── match.schema.ts       ← SharedMatch, SharedMatchesResponse, MatchDetail (new)
│   └── index.ts              ← re-exports all schemas
└── types/
    └── index.ts              ← z.infer<> types re-exported for consumers
```

**`MatchDetail` schema (new):**
```ts
export const matchDetailPlayerSchema = z.object({
  account_id:       z.number().nullable(),
  hero_id:          z.number(),
  player_slot:      z.number(),
  kills:            z.number(),
  deaths:           z.number(),
  assists:          z.number(),
  item_0:           z.number(),
  item_1:           z.number(),
  item_2:           z.number(),
  item_3:           z.number(),
  item_4:           z.number(),
  item_5:           z.number(),
  backpack_0:       z.number(),
  backpack_1:       z.number(),
  backpack_2:       z.number(),
  ability_upgrades: z.array(z.object({
    ability: z.number(),
    time:    z.number(),
    level:   z.number(),
  })).optional(),
})

export const matchDetailSchema = z.object({
  match_id:    z.number(),
  start_time:  z.number(),
  duration:    z.number(),
  radiant_win: z.boolean(),
  players:     z.array(matchDetailPlayerSchema),
})

export type MatchDetail       = z.infer<typeof matchDetailSchema>
export type MatchDetailPlayer = z.infer<typeof matchDetailPlayerSchema>
```

**Migration:** existing schemas from `frontend/src/services/api.ts` and `frontend/src/types/index.ts` move to `shared/` with no logic changes. Both backend and frontend import from `@stompt/shared`.

---

## 4. Package: `backend`

**Pattern: Route → Controller → Service**

```
packages/backend/src/
├── config/
│   ├── env.ts               ← Zod-validated env vars (PORT, OPENDOTA_BASE_URL, etc.)
│   └── opendota.ts          ← base URL, default headers, AbortSignal timeout
│
├── routes/
│   ├── index.ts             ← mounts all routers on Express app
│   ├── proEncounters.routes.ts
│   ├── proMatches.routes.ts
│   └── matchDetail.routes.ts        ← new
│
├── controllers/
│   ├── proEncounters.controller.ts
│   ├── proMatches.controller.ts
│   └── matchDetail.controller.ts    ← new
│
├── services/
│   ├── opendota.service.ts          ← HTTP client for OpenDota (fetch + retry + cache)
│   ├── proEncounters.service.ts
│   ├── proMatches.service.ts
│   └── matchDetail.service.ts       ← new
│
├── middlewares/
│   ├── errorHandler.ts      ← catches all errors, returns { error: string, status: number }
│   ├── validateParams.ts    ← Zod middleware for req.params / req.query
│   └── rateLimit.ts         ← prevents API abuse
│
└── app.ts                   ← Express setup: middlewares, routes, error handler
```

**New endpoint:**
```
GET /api/match-detail/:matchId
```

`matchDetail.service.ts` calls `https://api.opendota.com/api/matches/:matchId`, strips all fields not in `matchDetailSchema`, validates with `matchDetailSchema.parse()` (from `@stompt/shared`), and returns the result. The frontend never sees raw OpenDota match data.

**Request flow:**
```
Router → validateParams (matchId is numeric)
       → matchDetail.controller (extracts param, calls service, sends JSON)
       → matchDetail.service (calls OpenDota, parses schema, returns MatchDetail)
       → errorHandler (on any throw: { error, status })
```

**`opendota.service.ts`:** centralizes all OpenDota access — retry with exponential backoff (migrated from `frontend/src/services/api.ts`), `AbortSignal.timeout(8000)`, in-memory cache with TTL. The frontend calls only the backend — never OpenDota directly.

---

## 5. Package: `frontend`

**Feature-based structure with React Router v6:**

```
packages/frontend/src/
├── app/
│   ├── router.tsx           ← central route definition with lazy()
│   ├── providers.tsx        ← nested Context providers (HeroContext, etc.)
│   └── layout/
│       ├── RootLayout.tsx   ← Header, Footer, OfflineBanner, <Outlet />
│       └── PageWrapper.tsx  ← Suspense boundary + fade-in per page
│
├── features/
│   ├── player/
│   │   ├── components/
│   │   │   ├── HomePage.tsx         ← search + profile + pro table
│   │   │   ├── PlayerProfile.tsx
│   │   │   ├── HeroList.tsx         ← extracted from PlayerProfile
│   │   │   └── LastMatchCard.tsx    ← extracted from PlayerProfile
│   │   ├── hooks/
│   │   │   └── usePlayerProfile.ts
│   │   └── index.ts
│   │
│   ├── pros/
│   │   ├── components/
│   │   │   ├── ProEncounterTable.tsx
│   │   │   ├── ProEncounterRow.tsx
│   │   │   └── MatchHistory.tsx
│   │   ├── hooks/
│   │   │   ├── useProEncounters.ts
│   │   │   └── useSharedMatches.ts
│   │   └── index.ts
│   │
│   └── match/
│       ├── components/
│       │   ├── MatchComparisonPage.tsx  ← route root, fetches + orchestrates
│       │   ├── ComparisonTable.tsx      ← user vs pro header stats (KDA, result)
│       │   ├── ItemBuild.tsx            ← 6 item slots + 3 backpack slots
│       │   └── TalentTree.tsx           ← talent choices at levels 10/15/20/25
│       ├── hooks/
│       │   └── useMatchDetail.ts
│       └── index.ts
│
├── shared/
│   ├── components/
│   │   ├── ui/                      ← Button, Badge, Skeleton, Pill primitives
│   │   ├── HeroIcon.tsx
│   │   ├── SearchForm.tsx
│   │   └── EmptyState.tsx
│   ├── hooks/
│   │   ├── useHeroes.ts             ← reads from HeroContext
│   │   ├── useOnlineStatus.ts
│   │   └── useSearchHistory.ts
│   └── utils/
│       └── formatters.ts
│
└── services/
    └── api.client.ts                ← single file for all backend calls
```

**Router with code splitting:**
```tsx
// app/router.tsx
const HomePage    = lazy(() => import('../features/player/components/HomePage'))
const MatchDetail = lazy(() => import('../features/match/components/MatchComparisonPage'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true,              element: <HomePage /> },
      { path: 'match/:matchId',   element: <MatchDetail /> },
    ]
  }
])
```

`MatchComparisonPage` is only downloaded when the user navigates to `/match/:matchId` — the initial bundle does not grow.

**HeroContext (global):** hero map is fetched once at app mount inside `providers.tsx` and shared via Context. `useHeroes()` in any feature reads from it without re-fetching.

**Feature isolation rule:** a feature can import from `shared/` but never from another feature. `match/` never imports from `player/` or `pros/`.

---

## 6. Feature: Match Comparison (`/match/:matchId`)

### Entry point

In `MatchHistory.tsx`, each match card changes from:
```tsx
<a href={`https://www.opendota.com/matches/${match.match_id}`} ...>
```
to:
```tsx
<Link
  to={`/match/${match.match_id}?user=${userAccountId}&pro=${proAccountId}`}
>
```
Both account IDs travel as URL search params so that direct URL navigation (bookmarks, shared links) works without relying on router state. `useMatchDetail` reads them from `useSearchParams()`.

### `useMatchDetail` hook

```ts
function useMatchDetail(matchId: number, userAccountId: number, proAccountId: number) {
  // GET /api/match-detail/:matchId
  // Extracts userPlayer and proPlayer from players[] by account_id
  // Returns: { match, userPlayer, proPlayer, status, error }
}
```

Single fetch — the backend returns all players, the hook isolates the two relevant ones.

### Page layout

```
┌─────────────────────────────────────────────────────┐
│  ← Back     Match #7234567890    2 days ago   42:18  │
├──────────────────────┬──────────────────────────────┤
│  YOU                 │  PRO PLAYER                   │
│  [Hero] Invoker      │  [Hero] Invoker                │
│  WIN  12/3/8         │  LOSS  8/4/11                  │
├──────────────────────┴──────────────────────────────┤
│  FINAL ITEMS                                         │
│  [🗡][🛡][⚡][💎][🔥][🌊]  [🗡][🛡][⚡][💎][🔥][🌊]  │
│  Backpack: [  ][  ][  ]    Backpack: [  ][  ][  ]    │
├─────────────────────────────────────────────────────┤
│  TALENT TREE                                         │
│  Lv 25 ●──────────────────────● Lv 25               │
│  Lv 20 ●──────────────────────● Lv 20               │
│  Lv 15 ●──────────────────────● Lv 15               │
│  Lv 10 ●──────────────────────● Lv 10               │
├─────────────────────────────────────────────────────┤
│  SKILL BUILD  (levels 1–25)                          │
│  [Q][W][E][Q][R][Q]...   [Q][E][W][Q][R][W]...      │
└─────────────────────────────────────────────────────┘
```

### Comparison color logic

| Field | Highlight when |
|---|---|
| KDA | user's value is higher than pro's |
| Item slot | item matches pro's item in same slot (`border-dota-gold`) |
| Talent choice | matches pro's choice at same level |
| Skill order | same ability at same level as pro |

Items that match the pro's build get `border-dota-gold` highlight — immediate feedback.

### Talent tree data

Talent names (`"+20 Attack Speed"`) come from OpenDota's `/constants/abilities` public endpoint. Cached in `localStorage` with the same TTL pattern as the hero map.

### Match navigation

Previous/next arrows in the page header navigate between matches in the shared history with that pro. The list comes from `useSharedMatches(userAccountId, proAccountId)` which is already cached in `localStorage` — no extra fetch. The current `matchId` from params identifies the position in the list, arrows update only the `:matchId` segment while keeping `?user=&pro=` params intact.

If `user` or `pro` params are missing from the URL (malformed link), `MatchComparisonPage` renders an `ErrorMessage` asking the user to navigate from the match history table.

---

## 7. Migration Strategy

Phased to avoid breaking the working app:

1. **Phase 1 — Monorepo setup:** init pnpm workspace, create `shared/` package, migrate existing types/schemas
2. **Phase 2 — Backend restructure:** apply Route→Controller→Service pattern to existing endpoints, add `matchDetail` endpoint
3. **Phase 3 — Frontend restructure:** create feature folders, move components/hooks into features, add React Router v6
4. **Phase 4 — Match comparison feature:** implement `match/` feature, wire up navigation from MatchHistory

Each phase leaves the app fully functional — no big-bang cutover.

---

## 8. What Does Not Change

- All existing data-fetching logic and hook behavior
- Tailwind v4 color palette and CSS variables
- Zod validation approach (migrated to `shared/`, not rewritten)
- Vitest test setup and existing test coverage
- The retry + backoff logic in `opendota.service.ts` (migrated from `api.ts`)
- HeroBackground decorative component
- KofiWidget behavior
