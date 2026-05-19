# StompTracker — Cinematic Redesign

**Date:** 2026-05-01  
**Status:** Approved  
**Scope:** Complete visual redesign (new palette, typography, identity) + UX language improvements + match comparison full post-game screen

---

## 1. Overview

Full visual redesign of StompTracker from the current gold/dark aesthetic to a **cinematic, game-first** experience inspired by stratz.com. The hero's artwork is the visual protagonist of every page. New color palette (space-blue-black + cyan), new typography (Syne + Geist), complete UX language overhaul (no abbreviations), and a full match comparison screen with items, talents, skill build, GPM/XPM, damage, wards, and item timing.

**What does NOT change:** all hook logic, Zod validation, Supabase cache layer, localStorage TTL, AbortSignal timeouts, existing tests.

---

## 2. Visual Identity

### Color Palette

```css
/* Backgrounds */
--space-black:     #080c14   /* main background */
--space-surface:   #0f1623   /* cards and panels */
--space-elevated:  #161e2e   /* elements above surface */
--space-border:    #1e2d45   /* borders and dividers */

/* Accents */
--cyan-primary:    #00c2ff   /* primary accent (replaces gold) */
--cyan-dim:        #0088cc   /* hover states */
--gold-stat:       #f0b429   /* stats only: WR%, rank badge */

/* Game */
--win:             #00e5a0   /* victory */
--loss:            #ff4757   /* defeat */

/* Text */
--text-primary:    #e8f0fe   /* primary text */
--text-secondary:  #7a90aa   /* secondary text */
--text-muted:      #3d5068   /* labels, placeholders */
```

### Typography

```css
/* Stats, numbers, hero names, large titles */
font-family: 'Syne', sans-serif;    /* weights: 700, 800 */

/* Body, tables, UI elements, labels */
font-family: 'Geist', sans-serif;   /* weights: 400, 500, 600 */
```

**Type scale:**
- Stat display: `Syne 800, 48px` — for numbers like `"1,247"`
- Section title: `Syne 700, 24px` — hero names, page titles
- UI label: `Geist 500, 11px, uppercase, tracking-widest`
- Body: `Geist 400, 14px`
- Mono data: `Geist Mono 400, 13px` — match IDs, timestamps

### Hero Artwork

Source: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/{hero_name}.png`

Hero name format: strip `npc_dota_hero_` prefix from OpenDota's `name` field.  
Example: `npc_dota_hero_invoker` → `invoker` → URL ends in `invoker.png`.  
This field is already available in the hero constants returned by OpenDota `/constants/heroes`.

Usage: full-width background with `object-position: top center`, overlaid with:
```css
background: linear-gradient(to bottom, transparent 20%, var(--space-black) 80%)
```
Fallback if image 404s: solid `--space-surface` background — no broken image visible.

### UX Language Rule

Zero abbreviations in any visible UI text:
- `"327 games"` not `"327g"`
- `"Win Rate"` not `"WR"` or `"WR%"`
- `"Games Played"` not `"Games"`
- `"Last Played"` not `"Last Match"`
- `"Kills / Deaths / Assists"` not `"KDA"`
- `"Gold Per Minute"` not `"GPM"` (label only — the number stays as `"620"`)
- Only exception: match IDs use short format as they are technical identifiers

---

## 3. Routes

```
/                          ← HomePage: search + recent history
/player/:accountId         ← PlayerPage: profile + pro encounters table
/match/:matchId            ← MatchPage: full comparison vs pro
```

URL is clean and shareable. `/player/107588898` loads any player directly.

### RootLayout

Fixed nav with `backdrop-blur-md bg-space-black/70` — hero artwork is visible behind it on scroll. Contains: brand mark + quick search input (changes player without going back to home).

### Code Splitting

```tsx
const PlayerPage = lazy(() => import('../features/player/PlayerPage'))
const MatchPage  = lazy(() => import('../features/match/MatchPage'))
```

MatchPage only downloads when user opens a comparison.

---

## 4. HomePage (`/`)

Hero background (existing `HeroBackground` component), search input, recent search pills. On successful search → navigate to `/player/:accountId`. State lives in the URL route, not `?account=` query param.

---

## 5. PlayerPage (`/player/:accountId`)

### Hero Splash

Full-width artwork of the player's #1 hero (by combined score). Artwork fills the top ~40% of the page. Player identity overlaid at bottom of the splash:

```
[Avatar 64px]  PlayerName  🇦🇷
Ancient V  ·  1,247 Games  ·  68% Win Rate
```

Skeleton shimmer (`bg-space-elevated animate-pulse`) while loading.

### Top 3 Heroes

Three horizontal cards below the splash. Selection algorithm:

```ts
const maxGames = Math.max(...heroStats.map(h => h.games))
const score = (h: HeroStat) =>
  (h.win / h.games) * 0.5 +
  (Math.log10(h.games) / Math.log10(maxGames)) * 0.5

const topHeroes = heroStats
  .filter(h => h.games >= 20)
  .sort((a, b) => score(b) - score(a))
  .slice(0, 3)
```

A hero with 68% Win Rate in 247 games scores higher than one with 100% in 3 games.

Each card shows:
- Hero icon (48px)
- Hero name in `Syne 700`
- `"247 Games Played"` in `Geist 500`
- `"68% Win Rate"` in `gold-stat`
- Bicolor bar: wins segment in `--win`, losses in `--loss`

### Pro Encounters Table

**Columns on mobile:** Avatar, Name, Games Together, Win Rate, See Matches  
**Additional on desktop:** Current Team, Last Played, Country

**Language:**
- `"42 Games Together"` not `"42"`
- `"Win Rate"` column header not `"Win%"`
- `"Last Played"` not `"Last Match"`
- Ally/enemy pills: `"With: 71% Win Rate"` / `"Against: 44% Win Rate"` on hover

**Expanded row:** shows matches filtered to current patch only. Badge: `"Patch 7.38 · 12 Matches"` always visible at top of expanded section. No toggle — current patch is always the default.

Each match card in expanded row: `<Link to={/match/:matchId?user=X&pro=Y}>` — navigates to MatchPage.

---

## 6. MatchPage (`/match/:matchId?user=:accountId&pro=:proAccountId`)

### Hero Splash

Full-width artwork of the hero played in that match. Back link: `"← Back to profile"`.

Header line: `"Invoker  ·  Patch 7.38  ·  42:18  ·  2 days ago"`

### Comparison Header

```
      YOU                    PRO PLAYER
  [Avatar 48px]           [Avatar 48px]
  YourName                Miracle-
  ██ VICTORY              ░░ DEFEAT
```

### Section 1 — Main Stats

Two-column table. Label in `Geist 500 uppercase`. Numbers in `Syne 700`. Higher value highlighted in `cyan-primary`:

| Label | You | Pro |
|---|---|---|
| Kills | 12 | 8 |
| Deaths | 3 | 4 |
| Assists | 8 | 11 |
| Gold Per Minute | 620 | 710 |
| Experience Per Minute | 580 | 640 |
| Last Hits | 234 | 287 |
| Total Damage | 28,450 | 31,200 |

### Section 2 — Final Items

Six item slots + three backpack slots for each player.  
Item matching pro's build: `border-cyan-primary` highlight + tooltip with full item name on hover.  
Different item: neutral border.

### Section 3 — Talent Tree

Four rows (levels 10, 15, 20, 25). Each row shows both players' choices side by side.  
Same talent as pro: `text-win`.  
Different talent: `text-loss` + tooltip: `"Pro chose: +20 Attack Speed"`.

### Section 4 — Skill Build (levels 1–25)

Row of ability icons per level for each player.  
Level where build differs from pro: subtle `bg-loss/10` background.  
Same as pro: `bg-win/10`.

### Section 5 — First Key Item Timing

```
Your first key item:   Blink Dagger at 18:42
Pro's first key item:  Blink Dagger at 14:30  — "3:28 faster"
```

Key item defined as: first item with gold cost > 2,000 that is not a consumable.

### Section 6 — Vision

```
Observer Wards Placed:   You 4  ·  Pro 7
Sentry Wards Placed:     You 2  ·  Pro 4
```

### Match Navigation

```
← Previous Match     Match 3 of 8 with Miracle-     Next Match →
```

List comes from `useSharedMatches(userAccountId, proAccountId)` — already cached in localStorage. Arrows update only the `:matchId` segment, keeping `?user=&pro=` params intact.

If `user` or `pro` params are missing: render `ErrorMessage` asking user to navigate from the pro encounters table.

---

## 7. New Backend Endpoints

```
GET /api/match-detail/:matchId
```
Calls OpenDota `/matches/:matchId`, strips to `matchDetailSchema` fields, returns JSON. Filters `players[]` to only fields needed for comparison (items, ability_upgrades, GPM, XPM, last_hits, hero_damage, obs_placed, sen_placed).

```
GET /api/current-patch
```
Calls OpenDota `https://api.opendota.com/api/constants/patch`, which returns an array of patch objects ordered chronologically. Takes the last element's `name` field (e.g. `"7.38"`). Cached in memory with 24h TTL — patch changes are infrequent. Used by frontend to filter match history in expanded rows: only matches where `start_time` falls within the patch's date range are shown.

---

## 8. Top Heroes Algorithm Change

Current: sorts by `win / games` (pure winrate).  
New: combined score weighted 50/50 between winrate and relative game volume:

```ts
score = (winRate * 0.5) + (Math.log10(games) / Math.log10(maxGames) * 0.5)
```

Minimum threshold: 20 games (up from current 10).

---

## 9. Migration Notes

- `index.css` `@theme` block: replace all `--color-dota-*` variables with new space/cyan palette
- Add Syne and Geist via `@import` from Google Fonts / Vercel Fonts
- Existing `dota-radiant` / `dota-dire` references in components → replace with `--win` / `--loss`
- `HeroBackground` decorative component: keep for HomePage only
- All `{games}g` → `{games} games` (already fixed in current code)
- All `WR` / `Win%` labels → `Win Rate` (already fixed in current code)
