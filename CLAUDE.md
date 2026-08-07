# superForum

Reddit-like REST API backend. Built by Andre Balassiano and Luiz Tatemoto.

## Stack

- **Runtime**: Node.js + TypeScript 5
- **Framework**: Express 5
- **ORM**: Prisma 7 with `PrismaPg` adapter (direct pg connection, not Prisma's default connection pooler)
- **Auth**: Supabase — JWT tokens validated server-side via `supabase.auth.getUser(token)`
- **Database**: PostgreSQL (hosted on Supabase)
- **Validation**: Zod 4

## Running the project

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

## Architecture

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
- **Prisma client**: Generated to `src/generated/prisma/` (not the default `node_modules/.prisma/client`). Always import from `../../generated/prisma/client`, never from `@prisma/client`.
- **Prisma singleton**: `src/core/prismaSingleton.ts` — import this everywhere, never instantiate `PrismaClient` directly.
- **P2025 handling**: update/delete catch `P2025` (record not found) → `null` → 404. On create, a `P2025` from a nested `connect` to a missing related row is also caught → `null` → 404 (e.g. bad `communityId`/`postId`). The vote `set*` handlers pre-check the caller's Profile so a missing profile returns a clear 404 instead of masquerading as "target not found".
- **Status codes**: 201 on create, 200 on read/update, 204 on delete, 400 on bad input, 401 on missing/invalid auth, 403 on non-owner mutation, 404 on not found, 409 on conflict, 500 on unexpected. All modules, including `posts`, return `204` on delete.
- **Pagination (2026-08-04)**: the three list endpoints (`GET /posts`, `GET /posts/:postId/comments`, `GET /communities`) are cursor-paginated. Shared schema + `buildPage` helper in `src/core/pagination.ts`; a `validateQuery` middleware parses `?limit=`(default 20, max 100)/`?cursor=` and stashes them on `req.pagination` (Express 5 makes `req.query` read-only, so it's not overwritten like `req.body`). Repos take `limit + 1` with `orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]` and `cursor`+`skip: 1`; responses are a `{ items, nextCursor }` envelope (was a bare array — a deliberate breaking change to those reads). **Sort (2026-08-04, #7)**: `GET /posts` also takes `?sort=new|top` (`postListQuerySchema` spreads `paginationFields` + a `sort` enum); repo switches `orderBy` to `[{ score: 'desc' }, { id: 'desc' }]` for `top`, backed by `@@index([score])` on Post (migration `20260804030000_index_post_score`). `req.pagination` widened with optional `sort`.
- **Error envelope (2026-08-04)**: every 4xx/5xx response is normalized to `{ error: { message, details? } }` by one `errorEnvelope` middleware (wraps `res.json`; controllers still send plain `{ message }`). `details` carries the Zod issues on validation failures. Single source of truth — change the shape in one file.
- **CORS (2026-08-04)**: `cors` middleware in `app.ts`, allowlist from `CORS_ORIGIN` (comma-separated, defaults to `http://localhost:5173`). Non-browser clients (Postman, tests) unaffected.
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

Required in `.env` (see `.env.example` for annotated sources):

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