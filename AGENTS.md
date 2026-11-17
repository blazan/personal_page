# AGENTS.md — repository notes

Portfolio + admin panel for Marijana Mandić. Next.js (App Router) + TypeScript +
Tailwind v4 + SQLite (`better-sqlite3`) + `sharp`, shipped as a single Docker image.

## Layout

- `src/app/` — App Router pages and API routes. Public site at `/`, case studies at
  `/projects/[slug]`, admin at `/admin` (server-side gate: login form vs dashboard).
- `src/components/` — public UI. `src/components/admin/` — dashboard widgets.
- `src/lib/` — `db.ts` (schema + lazy seed), `seed-data.ts` (executive copy),
  `auth.ts` (JWT session), `validation.ts` (all input validation), `images.ts` (sharp).
- `scripts/seed.ts` — one-off seed runner. The app also seeds lazily on first read.

## Commands

```bash
npm run dev            # local dev (needs .env)
npx tsc --noEmit       # typecheck — must exit 0
docker compose up -d --build   # full stack; site on :3000
```

## Conventions

- Validate every request body in `src/lib/validation.ts` and reuse those helpers.
  Do not read `body.foo` directly in a route handler.
- Link/text fields from the admin are stored as-is and rendered into `href`, so any
  new href-like field must go through `validateHref`. Image fields use
  `validateImageUrl`. React escapes text content, so only `href`/`src` are XSS vectors.
- Section content is saved whole: the admin UI PUTs a complete section, and the API
  validates the whole section. There is no partial patch for content.
- Route status codes: create `201`, delete `200` with a JSON body, auth failure `401`.

## Gotchas

- Read `event.currentTarget` **before** any `await` in a React handler — React nulls
  it once the handler yields. Accessing it after an await throws and can report a
  failure for work that actually succeeded.
- Static chunks are served `immutable` for a year; a browser can hold a stale bundle
  after a rebuild. Verify bundle contents in the container, not in the browser cache.
- SQLite file and uploads live in Docker volumes (`data/`, `uploads/`), both gitignored.
- Seed copy uses bare fragment hrefs (`#projects`, `#contact`) — `validateHref` must
  keep accepting those or editing the shipped defaults breaks.
