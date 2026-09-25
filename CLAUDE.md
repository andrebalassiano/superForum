# superForum

Reddit-like full-stack forum. Built by Andre Balassiano and Luiz Tatemoto.

Two halves in one repo: a **REST API at the repository root** (everything below unless stated otherwise) and a **React client in `web/`**, which is a self-contained project with its own dependencies, TypeScript config, linter, formatter, and test runner. The root tooling deliberately does not reach into it — `eslint.config.mjs` ignores `web/**` and the root `.prettierignore` ignores `web`. See "The web client" below. Deployed: client on Vercel, API on Render, database and auth on Supabase.

## Stack (API)

- **Runtime**: Node.js + TypeScript 5
- **Framework**: Express 5
- **ORM**: Prisma 7 with `PrismaPg` adapter (direct pg connection, not Prisma's default connection pooler)
- **Auth**: Supabase — JWT tokens validated server-side via `supabase.auth.getUser(token)`
- **Database**: PostgreSQL (hosted on Supabase)
- **Validation**: Zod 4

## Running the project (API)

Andre runs all shell commands in **PowerShell** on Windows — use PowerShell syntax (`$env:VAR`, `;` for sequencing, no `&&` chaining) when suggesting commands.

Run the server:

```powershell
npm run dev          # one-shot (Ctrl+C to stop)
npm run dev:watch    # auto-restart on file changes
```

Type-check without emitting:

```powershell
npm run typecheck
```

Lint and format:

```powershell
npm run lint          # ESLint (type-aware, reads tsconfig.eslint.json)
npm run lint:fix      # ESLint with --fix
npm run format        # Prettier --write .
npm run format:check  # Prettier --check . (what CI runs)
```

Seed demo content into whatever `DATABASE_URL` points at (idempotent — fixed ids, upserted):

```powershell
npm run seed
```

The client is a separate project with its own scripts — see "The web client" below. Both halves must
be running for the app to work locally: the API on 3000, Vite on 5173.

## Architecture (API)

Every module follows a strict 4-layer pattern:

```
router → controller → service → repository
```

- **router**: Express routes + middleware wiring
- **controller**: HTTP request/response handling, calls service
- **service**: Business logic, calls repository
- **repository**: All Prisma queries, no business logic

## Module status

All five modules are implemented and wired into the main router (`src/routers/index.ts`):

- `auth` — profiles + current-user resolution (`POST /auth/profile`, `GET /auth/me`, `GET /auth/profiles/:id`)
- `posts` — full CRUD; write routes require `requireAuth` and run `validateBody`/`validateParams`; `authorId` comes from `req.user.id` (not the body); reads use `optionalAuth` and include `currentUserVote`; `GET /posts` is cursor-paginated with a `?sort=new|top` feed sort (`?limit=&cursor=` → `{ items, nextCursor }`); PATCH/DELETE enforce author ownership
- `communities` — full CRUD (renamed from `subreddits` on 2026-07-20); has an `ownerId`; `GET /communities` is a public cursor-paginated list; `GET /communities/:id/posts` lists a community's posts (nested router owned by the posts module — `communityPostsRouter`, `mergeParams`, mounted at `/communities/:id/posts`; reuses `postsController.getPostsByCommunity` → `getAllPosts(userId, pagination, communityId)`, same envelope/sort/currentUserVote as `GET /posts`; empty page for a missing/empty community, not a 404); PATCH/DELETE enforce owner ownership
- `comments` — full CRUD; create and list are nested under the post (`POST`/`GET /posts/:postId/comments`, `postId` from the URL), read/update/delete a single comment at `/comments/:id`; PATCH/DELETE enforce author ownership
- `votes` — post & comment votes via `PUT`/`DELETE` on `/posts/:postId/vote` and `/comments/:commentId/vote` (upsert toggle); `userId` from the token

## Key conventions

- **Auth**: `requireAuth` middleware validates the Bearer token and attaches `req.user: { id, email }` to the request. `optionalAuth` is the soft sibling — it attaches `req.user` when a valid token is present but never rejects, used on public GETs that personalize the response. Controllers check `req.user` defensively even after `requireAuth`.
- **Validation**: `validateBody(schema)` and `validateParams(schema)` middleware use Zod `safeParse` and return 400 with Zod error issues on failure. All write-body schemas use `.strict()`, so unknown keys are rejected with a 400 rather than silently stripped.
- **Ownership**: update/delete services take the caller's `userId`, fetch the row, and compare `authorId` (posts/comments) or `ownerId` (communities). Mismatch returns a `FORBIDDEN` sentinel the controller maps to `403`; a missing row returns `null` → `404`.
- **DTOs**: Inferred from Zod schemas via `z.infer<typeof schema>`. Defined in `<module>.schemas.ts`.
- **Prisma client**: Generated to `src/generated/prisma/` (not the default `node_modules/.prisma/client`). Always import from `../../generated/prisma/client`, never from `@prisma/client`. The generator is pinned to **`moduleFormat = "cjs"`** (2026-09-21): the project compiles to CommonJS, and Prisma's default ESM output contains `import.meta.url`, which makes Node's module detection treat the compiled client as ESM and crash on `exports` under `node dist/server.js`. Dev (`tsx`) and Vitest transpile on the fly and mask this — only the real production start path (`npm run build && npm start`) exposes it, so rehearse that path after any generator change.
- **Data API lockdown (2026-09-24)**: Supabase serves every `public` table over PostgREST at `/rest/v1/`, authorized by the publishable key that ships in the browser bundle — a second door onto the same rows that bypasses `requireAuth` and every ownership check. A security pass found the tables were in fact closed (Supabase enables RLS on new `public` tables by default, and no policies exist), but nothing in this repo said so. Migration `20260924000000_restrict_data_api_roles` makes it explicit: `ENABLE ROW LEVEL SECURITY` on all six models plus a `REVOKE ALL ... FROM anon, authenticated`, wrapped in a `pg_roles` existence check so it is a no-op on the plain Postgres the tests and CI run against. **Never add `FORCE ROW LEVEL SECURITY`** — the API connects as the table owner, which RLS skips unless forced, so forcing it would lock the app out of its own data. The Data API is also switched off for the project in the dashboard (nothing here uses PostgREST; the client only calls `supabase.auth.*`).
- **Prisma singleton**: `src/core/prismaSingleton.ts` — import this everywhere, never instantiate `PrismaClient` directly.
- **P2025 handling**: update/delete catch `P2025` (record not found) → `null` → 404. On create, a `P2025` from a nested `connect` to a missing related row is also caught → `null` → 404 (e.g. bad `communityId`/`postId`). The vote `set*` handlers pre-check the caller's Profile so a missing profile returns a clear 404 instead of masquerading as "target not found".
- **Status codes**: 201 on create, 200 on read/update, 204 on delete, 400 on bad input, 401 on missing/invalid auth, 403 on non-owner mutation, 404 on not found, 409 on conflict, 500 on unexpected. All modules, including `posts`, return `204` on delete.
- **Pagination (2026-08-04)**: the three list endpoints (`GET /posts`, `GET /posts/:postId/comments`, `GET /communities`) are cursor-paginated. Shared schema + `buildPage` helper in `src/core/pagination.ts`; a `validateQuery` middleware parses `?limit=`(default 20, max 100)/`?cursor=` and stashes them on `req.pagination` (Express 5 makes `req.query` read-only, so it's not overwritten like `req.body`). Repos take `limit + 1` with `orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]` and `cursor`+`skip: 1`; responses are a `{ items, nextCursor }` envelope (was a bare array — a deliberate breaking change to those reads). **Sort (2026-08-04, #7)**: `GET /posts` also takes `?sort=new|top` (`postListQuerySchema` spreads `paginationFields` + a `sort` enum); repo switches `orderBy` to `[{ score: 'desc' }, { id: 'desc' }]` for `top`, backed by `@@index([score])` on Post (migration `20260804030000_index_post_score`). `req.pagination` widened with optional `sort`.
- **Error envelope (2026-08-04)**: every 4xx/5xx response is normalized to `{ error: { message, details? } }` by one `errorEnvelope` middleware (wraps `res.json`; controllers still send plain `{ message }`). `details` carries the Zod issues on validation failures. Single source of truth — change the shape in one file.
- **CORS (2026-08-04)**: `cors` middleware in `app.ts`, allowlist from `CORS_ORIGIN` (comma-separated, defaults to `http://localhost:5173`). Non-browser clients (Postman, tests) unaffected.
- **Lint/format (2026-08-07, #17)**: ESLint 10 flat config (`eslint.config.mjs`) with `typescript-eslint` **type-checked** rules + Prettier 3 (`.prettierrc.json`: 4-space, single quotes, semis, printWidth 100; JSON overridden to 2-space so npm doesn't fight it). Prettier and ESLint stay in separate lanes — `eslint-config-prettier` (last in the config) disables formatting rules; Prettier is NOT run through ESLint. Type-aware linting reads a lint-only `tsconfig.eslint.json` (extends the src-only build tsconfig, widened to cover `test/**` + `*.config.ts`). Two deliberate rule relaxations: `unbound-method` is **off globally** (controllers are object-literal handler namespaces passed to Express by reference; they never use `this`, and there are no classes here), and the `no-unsafe-*` family + `require-await` + `no-unnecessary-type-assertion` are **off under `test/**`** (supertest's `res.body` is `any`; asserting on it is what E2E tests do). Prettier ignores generated code, the hand-authored `*.md` docs, and the Postman export (its own 2-space format). CI runs `lint` + `format:check` after `prisma generate` (the type-aware parser needs the generated client to resolve `src` imports).
- **Coverage/cleanup (2026-08-06, #5)**: dropped dead code the coverage report surfaced — the vote repos' pre-#8 `create`/`findById`/`findByPost`/`findByComment`/`updateById` (superseded by `upsertWithScore`/`deleteWithScore`), and `posts.repository.findByCommunityId` (folded into `findAll(userId, pagination, communityId?)` when the community-posts route was promoted). Added tests for genuinely-reachable-but-untested paths (community-posts feed, `DELETE /communities/:id` missing → 404). Deliberately left uncovered: the `catch → 500` blocks, `if(!req.user)` guards after `requireAuth`, and non-P2025 re-throws — unreachable without faking impossible states. 87 tests; Functions coverage now 100%.
- **Rate limiting (2026-08-06, #9)**: `express-rate-limit` v8 via a `createRateLimiter(overrides)` factory in `src/middleware/rateLimiter.ts`, mounted once in `app.ts` (after `errorEnvelope`, before `express.json`). Limits WRITES by IP (skips GET/HEAD/OPTIONS); over the cap → `429` in the standard `{ error: { message } }` envelope (custom `handler` calls `res.json`). Cap is env-configurable — `RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX` (defaults 15min/100). Keyed by IP not user on purpose (dropping the token must not dodge the limit). **Disabled under `NODE_ENV=test`** (the suite fires far more than the cap per window); the 429 path is covered directly by `test/integration/rateLimit.test.ts` on a throwaway app with a tiny limit. Prod-behind-proxy needs `trust proxy` (README note).
- **Timestamps (2026-08-04)**: the client-supplied `timestamp` column was DROPPED from Post and Comment (migration `20260804010000_drop_post_comment_timestamp`); `createdAt` (`@default(now())`) is the sole creation time. Create bodies no longer accept `timestamp`.
- **Vote score (2026-08-04, #8)**: Post and Comment carry a denormalized `score Int @default(0)` (migration `20260804020000_add_vote_score`, backfilled from existing votes). Maintained by the vote repos' `upsertWithScore`/`deleteWithScore`, which wrap the vote write + a `score { increment/decrement }` in one `prisma.$transaction` using the `(newValue - oldValue)` delta. Reads return `score` automatically (it's a scalar the reshape passes through). This is the foundation for #7 sort-by-top (`orderBy: { score }`).

## Data models (summary)

- `Profile` — id is the Supabase auth UUID (not auto-generated), has unique `username`
- `Post` — belongs to `Profile` (author) and `Community`; has `comments` and `votes`
- `Comment` — belongs to `Post` and `Profile`; has `votes`
- `Community` — has unique `name` and an `ownerId` (its creator, from the token); owns posts (cascade delete)
- `PostVote` / `CommentVote` — unique per (entity, user) pair; `value` is an Int (upvote/downvote)

## Environment variables

The API reads `.env`; the client reads its own `web/.env.local` (see `web/.env.example`). Only
`VITE_`-prefixed variables reach browser code, and every one of them is compiled into the bundle and
public by definition — never put a secret behind that prefix.

Required in `.env` (see `.env.example` for annotated sources, including the deploy-only `PORT`,
`TRUST_PROXY`, `CORS_ORIGIN` and rate-limit knobs):

```
DATABASE_URL=            # pooled Postgres connection (runtime queries)
DIRECT_URL=              # direct Postgres connection (Prisma migrations)
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

## Prisma workflow

After schema changes:

```bash
npx prisma migrate dev --name <migration_name>
npx prisma generate
```

Note: `prisma migrate dev` is interactive. For a rename or a change that would otherwise drop or reject data on existing rows (e.g. adding a NOT NULL column), hand-write the migration with `ALTER ... RENAME` / `ADD COLUMN` + backfill, then apply with `npx prisma migrate deploy` (non-interactive). This is how the community rename and the `ownerId` backfill preserved existing rows.

## The web client (`web/`)

A React 19 single-page app built by Vite 8 on TypeScript 6. React Router 8 for routing, TanStack Query 5 for server state, `@supabase/supabase-js` for auth, Tailwind 4 for styling, oxlint + Prettier, Vitest + React Testing Library for tests. It is a real consumer of the API — no mock data anywhere.

```powershell
cd web
npm run dev          # Vite dev server on http://localhost:5173
npm run build        # tsc -b && vite build — the type-check IS the build
npm run lint         # oxlint
npm run format       # Prettier (format:check is what CI runs)
npm test             # Vitest (npm run test:watch to keep it open)
```

### Layout

- `src/api.ts` — the single HTTP choke point. Everything else calls `apiFetch`; nothing calls `fetch` directly.
- `src/auth/` — `AuthContext.ts` (context + the `useAuth` hook), `AuthProvider.tsx` (session state), `useProfile.ts` (the caller's Profile row).
- `src/pages/` — one component per route, wired in `App.tsx`.
- `src/components/` — shared UI. `states.tsx` holds the skeleton/empty/error primitives.
- `src/hooks/useInfiniteScroll.ts` — the `IntersectionObserver` that drives paging.
- `src/lib/` — `supabase.ts` (client singleton), `time.ts` (`timeAgo`).
- `src/test/` — `setup.ts` (jest-dom matchers + cleanup) and `renderWithProviders.tsx`.
- `src/types.ts` — the API response shapes the UI reads.

### Conventions

- **One fetch wrapper.** `apiFetch<T>(path, { method, body })` attaches the bearer token, sets the content type, unwraps the API's `{ error: { message } }` envelope into a thrown `ApiError`, and returns `undefined` for a 204. `ApiError` carries `.status`, which is how a caller tells one failure from another — `useProfile` turns a 404 from `GET /auth/me` into `null` rather than an error, because "signed in but no profile yet" is a state the UI renders.
- **A 401 is a state transition, not an error (2026-09-23).** If a request 401s _and a token was sent_, `apiFetch` refreshes the session once and replays the request; if that fails it calls `supabase.auth.signOut()` so the UI stops claiming to be signed in, and throws "Your session has expired". Exactly one retry, and never for an anonymous request. Without this the client sat on a dead session while every write failed — which is what happens when several tabs race to refresh and Supabase revokes the session family for reusing a rotated refresh token.
- **Query keys.** `['posts', sort]` (feed), `['post', id]`, `['comments', postId]`, `['communities']` (browse list), `['communities', 'all']` (the post form's picker), `['community', id]` (the entity), `['community', id, 'posts']` (its feed), `['profile', 'me']`. Invalidation leans on prefix matching — invalidating `['communities']` also refreshes `['communities', 'all']`. Anything matching on key SHAPE must be careful: `VoteButtons`' `isPostListQuery` predicate matches `['posts', …]` and `['community', id, 'posts']` but must NOT match `['community', id]`, which holds an entity rather than a paged list.
- **Two write strategies, chosen per mutation.** Voting is **optimistic**: `onMutate` patches every cached copy of the post (the detail query and every matching list query) with the same score delta the server will apply, snapshots the old values, and `onError` restores them. Everything else — creating, editing, deleting a post or comment — **invalidates and refetches**, because the server assigns ids and timestamps and there is nothing useful to guess.
- **Supabase identity and the app's Profile are two records.** Signing up creates the auth user; `POST /auth/profile` creates the `Profile` that posts, comments and votes point at. `signUp` does both. `/welcome` (`WelcomePage.tsx`) recovers an account that has one and not the other, and `App.tsx` shows a banner whenever `useProfile` returns `null`. A Profile's id IS the Supabase user id, which is why `user.id === post.authorId` is a valid ownership comparison.
- **Ownership in the UI is cosmetic.** `OwnerActions` renders Edit/Delete only for your own content, but the API re-checks on every `PATCH`/`DELETE` and answers 403 regardless. Never treat a hidden button as a control.
- **Styling is Tailwind over semantic tokens, not raw colors.** The palette lives as CSS variables in `index.css` that flip under `prefers-color-scheme: dark`, exposed to Tailwind through `@theme inline` as `bg-bg`, `text-heading`, `text-muted`, `border-border`, `text-accent`, `bg-accent-soft`, `border-accent-line`, `bg-surface`, and the `danger` trio. **There are no `dark:` variants** — the tokens handle both themes. Two gotchas: opacity modifiers (`text-muted/50`) do not work on var-based tokens, and the canonical class is `wrap-break-word`, not `break-words`.
- **Fast Refresh forces some file splits.** oxlint's `react/only-export-components` fires when a module exports both a component and something else, which breaks hot reload. That is why `AuthContext.ts` (context + hook) is separate from `AuthProvider.tsx`, and `buttonStyles.ts` (`buttonClasses`) from `Button.tsx`. Keep new shared helpers out of component files.
- **Icon components REPLACE their default className.** `<Thumb className="sm:hidden" />` drops the default `h-5 w-5` and renders a zero-size SVG. Always pass sizing when overriding: `className="h-5 w-5 sm:hidden"`.
- **`erasableSyntaxOnly` is on.** Every TypeScript construct must vanish at build time, so no parameter properties (`constructor(readonly x: T)`), no enums, no namespaces. `ApiError` declares and assigns its `status` field separately for this reason.
- **Tests.** `vitest.config.ts` is deliberately separate from `vite.config.ts` (jsdom, globals, no Tailwind processing — tests assert on structure and behaviour, never computed styles). `renderWithProviders` supplies the router, a query client and the auth context, with a `signedIn` toggle. Query by role and accessible name, never by class. **Where a component's real behaviour is a cache write rather than a rendered value — optimistic voting — assert against the query cache**, because the rendered score comes from props and a DOM-only test would pass while the feed silently stopped updating. Mock `../api` so no test can reach the network.
- **Env vars** are typed in `src/vite-env.d.ts`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (required), `VITE_API_URL` (falls back to `http://localhost:3000/api`), and the optional `VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD` that gate the "Try the demo" panel on the sign-in page. All of them ship in the bundle.
- **Prettier config is duplicated, on purpose.** `web/.prettierrc.json` repeats the root's settings rather than importing them, so `web/` stays a project that works on its own. Prettier is pinned exactly (3.9.6) in both halves so a patch bump cannot make `format:check` disagree across them.
- **Deploy.** Vercel builds with Root Directory `web`; `web/vercel.json` rewrites every path to `index.html` so React Router owns the URL and a direct visit to `/posts/:id` does not 404.

### CI

`.github/workflows/ci.yml` runs two jobs in parallel: `test` (the API, with a Postgres service container) and `web` (`npm ci`, `lint`, `format:check`, `test`, `build`, all inside `web/` via `defaults.run.working-directory`, with `cache-dependency-path: web/package-lock.json` so the two jobs cache separately). The client job needs no database and no secrets — its tests mock `api.ts`.

## Checkpoint — 2026-07-21

Built incrementally as a learning exercise — Andre reviews each step and wants to understand and defend every line. The core build-out is complete, the happy-path and negative-path flows are verified end-to-end via Postman, and a validation/authorization hardening pass is done.

### State of the project

- **All five modules implemented and wired**: auth, posts, communities, comments, votes.
- **Auth hardened**: post/comment/vote/community writes require `requireAuth`; `authorId` / `userId` / community `ownerId` come from the JWT, never the request body (impersonation-safe).
- **Reads personalized**: `optionalAuth` on GETs folds `currentUserVote` into post/comment reads without forcing a login.
- **Hardening pass (2026-07-21)**: Zod `.strict()` on all write bodies (unknown key → 400); the posts module's missing `validateBody`/`validateParams` wired in; create-with-nonexistent-FK maps to `404` (P2025), not 500; a voter with no Profile gets a clear `404`; `title` requires `.min(1)`; posts delete returns `204`. **Ownership enforced**: only the author may PATCH/DELETE a post or comment, and only the owner may modify a community — `403` otherwise.
- **Subreddit → Community rename (2026-07-20)**: full rename across DB, code, and docs via the data-preserving migration `20260720163000_rename_subreddit_to_community`. `/api/communities` is live; posts expose `communityId` + a nested `community` object; the old `/api/subreddits` route is gone.
- **Community ownership (2026-07-21)**: `ownerId` added to `Community` via a data-preserving migration (existing rows backfilled to the sole real user).
- **Repo moved** to Andre's personal GitHub (`github.com/andrebalassiano/superForum`); Luiz Tatemoto remains a collaborator.
- **README + `package.json`** completed (portfolio-facing).
- **Postman E2E verified**: full happy-path (auth → community → post → reads → vote lifecycle → comment) plus a complete negative-path battery (validation 400s, auth 401s, 404s, 409, ownership 403s).

### Known rough edges (deliberately deferred)

1. The nested `POST /posts/:postId/comments` route isn't exposed — creating a comment still uses `POST /comments` with `postId` in the body (only the nested GET list route exists).
2. Create-post when the *author's* Profile row is missing returns a misleading `404 "Community not found"` (the author connect also throws P2025; only the vote handlers pre-check the profile).

### Next steps

Superseded by the 2026-07-25 checkpoint below.

## Checkpoint — 2026-07-25

Automated testing + CI landed and merged to `main` (PR #1, merge commit `c56cd41`, two feature commits `e8b612e`/`e91548b`). superForum's last portfolio gap — no tests — is closed. Working tree clean.

### What shipped since 2026-07-21

- **Integration test suite**: 68 Vitest + supertest tests across all five modules, driving the real Express app end-to-end. Supabase auth is mocked at the client boundary (`test/setup/each-setup.ts`, two users Alice/Bob) so no real tokens are needed; runs against a throwaway Postgres (Docker `docker-compose.test.yml` on :5433 locally, a GitHub Actions service container in CI), migrated fresh and truncated between tests. Run with `npm test` / `npm run test:coverage`. The default config only includes `test/integration/**`. Local test DB needs `.env.test` (copy from `.env.test.example`) and the container up. Harness + the Prisma-client-under-Vite gotcha (solved by a `prismaTsResolver` plugin in `vitest.config.ts`) are detailed in the `project-test-suite-plan` memory.
- **Real-token lane (2026-08-01)**: an opt-in second Vitest config (`vitest.realtoken.config.ts`, `npm run test:realtoken`, specs in `test/realtoken/`) that runs WITHOUT the Supabase mock — it signs a real test user into Supabase, gets a genuine JWT, and drives it through `requireAuth` end-to-end. Gated on creds in `.env.test.realtoken` (copy from `.env.test.realtoken.example`); with no creds it skips cleanly (exit 0), so the default run and CI stay secret-free. This is backlog item 4 done.
- **GitHub Actions CI** (`.github/workflows/ci.yml`): Node 24, Postgres service container, steps checkout → `npm ci` → `prisma generate` (client is git-ignored) → `prisma migrate deploy` → `npm run typecheck` → `npm run test:coverage` → single Codecov upload (`codecov/codecov-action@v5`, `CODECOV_TOKEN` repo secret). Triggers on push to `main` + all PRs. First run green in 54s.
- **Codecov** wired; coverage badge live (~69% — the gap is unreachable 500-catch/`if(!req.user)` guards, not missed behavior). README shows CI + coverage badges.
- **README refreshed (2026-07-25)**: added the ownership/403 decision, a Tests section, and replaced the stale "Still to come" (it had listed ownership/FK-404/tests as undone — the opposite of reality). Prose-first, no-AI-tells voice preserved.
- **Tooling**: `gh` CLI installed + authed on Andre's machine.

### Known rough edges

None outstanding. Recently resolved:
- **Author-profile 404 (2026-08-01):** `createPost`/`createComment` now pre-check the caller's Profile (`authRepository.findProfileById`) and return a `PROFILE_NOT_FOUND` sentinel → controller answers `404 "Profile not found — create your profile first"`, instead of the old misleading "Community/Post not found". Mirrors the votes module. +2 Vitest tests (68 total).
- **Nested comment route (2026-07-25):** `POST /posts/:postId/comments` exposed, flat `POST /comments` removed — `postId` comes from the URL.

### Next steps — full prioritized list in the `project-refinement-backlog` memory

The two portfolio-facing items (Postman collection, author-profile 404) are done. Remaining, in ROI order: **real-token hybrid auth test + coverage bump** → then API-maturity (pagination first). newman-in-CI is optional and overlaps with the real-token work.