# Agent Guidelines

These instructions apply to the whole repository. They are meant for Codex and
other coding agents working on this project.

## Project Shape

- This is a private npm workspace with `frontend` and `backend` packages.
- Frontend: React, TypeScript, Vite, Tailwind, Vitest.
- Backend: Express, TypeScript, Supabase, OpenDota integrations, Vitest.
- End-to-end tests live in `e2e` and run through Playwright.
- Supabase database changes live in `supabase/migrations`.

## Research Notes

- Before designing OpenDota-backed coaching features, read
  `docs/opendota-coaching-research.md`. It documents the investigated OpenDota
  endpoints, live-match limitations, coaching feature ideas, and repo-specific
  implementation guidance.

## Core Commands

- Install dependencies from the repo root with `npm install`.
- Run both apps in development with `npm run dev`.
- Build everything with `npm run build:all`.
- Run all unit tests with `npm test`.
- Run lint checks with `npm run lint`.
- Run end-to-end tests with `npm run test:e2e`.
- For focused work, prefer workspace commands such as:
  - `npm run test --workspace=frontend`
  - `npm run test --workspace=backend`
  - `npm run build --workspace=frontend`
  - `npm run build --workspace=backend`

## Architecture Guidelines

- Keep frontend API access inside `frontend/src/services` and reusable client
  state in `frontend/src/hooks`.
- Keep backend HTTP routing in `backend/src/routes`, validation schemas in
  `backend/src/schemas`, middleware in `backend/src/middleware`, and external
  integrations or business logic in `backend/src/services`.
- Do not place business rules directly in React components or Express route
  handlers when they can live in typed hooks, services, or schemas.
- Prefer small, typed functions with explicit input and output shapes over
  broad shared utilities.
- When adding a new backend endpoint, add or update its route, schema,
  service-layer tests, route tests, and frontend service/hook usage together.
- When adding a new comparison feature, follow the existing position comparison
  pattern before introducing a new abstraction.

## Security Guidelines

- Never commit secrets, API keys, service-role keys, tokens, or real user data.
- Treat all request parameters, query strings, body fields, and external API
  responses as untrusted. Validate with Zod or existing schema helpers before
  use.
- Preserve backend rate limiting, Helmet, CORS restrictions, and centralized
  error handling when editing the Express app.
- Do not expose Supabase service-role credentials or backend-only environment
  variables to the frontend. Frontend variables must be safe to publish.
- Keep logs useful but avoid logging secrets, full tokens, cookies, auth
  headers, or unnecessary personal data.
- For database migrations, keep row-level security intent explicit and document
  any broad policies in the migration itself.
- When dependencies or network calls are added, consider timeout behavior,
  retries, cache impact, and failure modes.

## Refactoring Guidelines

- Refactor in small, behavior-preserving steps. Keep public API shapes stable
  unless the caller changes are included in the same work.
- Read nearby tests before changing code and update the tests that describe the
  behavior being changed.
- Avoid unrelated formatting churn, file moves, or broad rewrites during a
  focused feature or bug fix.
- Reuse existing naming, folder boundaries, error patterns, and test style.
- If duplicate code appears in at least two comparison services, prefer
  extracting through the existing base service pattern rather than adding a new
  parallel abstraction.

## Frontend Guidelines

- Keep components focused on rendering and user interaction; move data fetching
  and derived state into hooks or services.
- Use typed props and shared domain types from `frontend/src/types` when
  possible.
- Maintain responsive layouts and verify that loading, empty, error, offline,
  and success states still render cleanly.
- Do not introduce new UI libraries or icon systems unless the existing stack
  cannot support the requirement.

## Backend Guidelines

- Validate inputs at the route boundary before calling services.
- Keep route handlers thin: parse, validate, call a service, return a response.
- Put OpenDota, Supabase, cache, and comparison logic behind services so they
  are testable without HTTP.
- Prefer typed errors or existing error middleware behavior over ad hoc
  `try/catch` response handling scattered across routes.
- Keep cache keys deterministic and include every input that changes the
  response.

## Testing Expectations

- For frontend changes, run or add Vitest tests for affected components, hooks,
  services, or formatters.
- For backend changes, run or add Vitest tests for affected schemas, services,
  routes, and middleware.
- For user-facing search or navigation changes, run or update Playwright tests
  in `e2e`.
- If a test cannot be run, state which command was skipped and why.

## Agent Workflow

- Check `git status --short` before editing and do not revert user changes.
- Use `rg`/`rg --files` for repository search.
- Use `apply_patch` for manual edits.
- Keep changes scoped to the requested task.
- Before finishing, run the narrowest useful verification command first, then a
  broader command when the change has wider impact.
- Summarize changed files and verification results in the final response.
