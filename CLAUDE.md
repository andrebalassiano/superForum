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
- `posts` — full CRUD; write routes require `requireAuth`; `authorId` comes from `req.user.id` (not the body); reads use `optionalAuth` and include `currentUserVote`
- `communities` — full CRUD (renamed from `subreddits` on 2026-07-20; see checkpoint)
- `comments` — full CRUD, plus the nested list route `GET /posts/:postId/comments`
- `votes` — post & comment votes via `PUT`/`DELETE` on `/posts/:postId/vote` and `/comments/:commentId/vote` (upsert toggle); `userId` from the token

## Key conventions

- **Auth**: `requireAuth` middleware validates the Bearer token and attaches `req.user: { id, email }` to the request. `optionalAuth` is the soft sibling — it attaches `req.user` when a valid token is present but never rejects, used on public GETs that personalize the response. Controllers check `req.user` defensively even after `requireAuth`.
- **Validation**: `validateBody(schema)` and `validateParams(schema)` middleware use Zod `safeParse` and return 400 with Zod error issues on failure.
- **DTOs**: Inferred from Zod schemas via `z.infer<typeof schema>`. Defined in `<module>.schemas.ts`.
- **Prisma client**: Generated to `src/generated/prisma/` (not the default `node_modules/.prisma/client`). Always import from `../../generated/prisma/client`, never from `@prisma/client`.
- **Prisma singleton**: `src/core/prismaSingleton.ts` — import this everywhere, never instantiate `PrismaClient` directly.
- **P2025 handling**: `updateById` and `deleteById` operations catch `PrismaClientKnownRequestError` with code `P2025` (record not found) and return `null`; controllers map `null` to 404.
- **Status codes**: New modules follow REST conventions — 201 on create, 200 on read/update, 204 on delete, 400 on bad input, 401 on missing/invalid auth, 404 on not found, 409 on conflict, 500 on unexpected. All modules, including `posts`, return `204` on delete.

## Data models (summary)

- `Profile` — id is the Supabase auth UUID (not auto-generated), has unique `username`
- `Post` — belongs to `Profile` (author) and `Community`; has `comments` and `votes`
- `Comment` — belongs to `Post` and `Profile`; has `votes`
- `Community` — has unique `name`, owns posts (cascade delete)
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

Note: `prisma migrate dev` is interactive. For a rename or other change that would otherwise drop data, generate the migration and hand-edit it to use `ALTER ... RENAME`, then apply with `npx prisma migrate deploy` (non-interactive). This is how the community rename preserved existing rows.

## Checkpoint — 2026-07-20

Built incrementally as a learning exercise — Andre reviews each step and wants to understand and defend every line. The core build-out is complete and the happy-path flow is verified end-to-end via Postman.

### State of the project

- **All five modules implemented and wired**: auth, posts, communities, comments, votes.
- **Auth hardened**: post/comment/vote writes require `requireAuth`; `authorId` / `userId` come from the JWT, never the request body (impersonation-safe).
- **Reads personalized**: `optionalAuth` on GETs folds `currentUserVote` into post/comment reads without forcing a login.
- **Subreddit → Community rename (2026-07-20)**: full rename across DB, code, and docs via the data-preserving migration `20260720163000_rename_subreddit_to_community`. `/api/communities` is live; posts expose `communityId` + a nested `community` object; the old `/api/subreddits` route is gone.
- **Repo moved** to Andre's personal GitHub (`github.com/andrebalassiano/superForum`); Luiz Tatemoto remains a collaborator.
- **README + `package.json`** completed (portfolio-facing).
- **Postman E2E verified**: auth → create community → create post → read (authenticated + anonymous) → vote lifecycle (cast / overwrite / delete) → create comment → read reflects comments and `_count`.

### Known rough edges (deliberately deferred)

1. No ownership checks — any authenticated user can PATCH/DELETE any post/comment/community. Only identity is enforced, not authorization.
2. Foreign-key violations (a bogus `communityId` on create post, or `postId` on create comment) surface as `500`, not `404` (the `P2003` catch isn't narrowed).
3. Request-body schemas use Zod's default behavior (unknown keys silently stripped), so a bogus/typo'd field in a write body returns `200` doing nothing instead of `400`. Adopt `.strict()` — current top to-do.
4. Misleading 404 on the vote handlers when the caller's Profile row is missing (indistinguishable from the target post/comment not existing, since both are `P2025` inside the upsert).

### Next steps

1. Finish the remaining Postman checks: comment votes (`PUT`/`DELETE /comments/:commentId/vote`), the nested comment list (`GET /posts/:postId/comments`), and the mutation routes (PATCH/DELETE on posts, comments, communities).
2. Add an automated integration test suite over the core endpoints, then a GitHub Actions CI workflow.
3. Add CI-passing + coverage badges to the README once tests + CI exist.