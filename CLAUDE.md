# superForum

Reddit-like REST API backend. Built by Andre and Luiz.

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

Wired into the main router (`src/routers/index.ts`):

- `auth` — fully implemented
- `posts` — fully implemented (but write routes still missing `requireAuth`, and `authorId` still comes from request body instead of the auth token)

Not yet wired (see Checkpoint at bottom):

- `subreddits` — partially implemented (schemas, service, controller done; router pending)
- `comments` — only the repository has content; everything else is empty
- `votes` — only `commentVote.repository.ts` and `postVote.repository copy.ts` have content; everything else is empty

## Key conventions

- **Auth**: `requireAuth` middleware validates the Bearer token and attaches `req.user: { id, email }` to the request. Controllers check `req.user` defensively even after `requireAuth`.
- **Validation**: `validateBody(schema)` and `validateParams(schema)` middleware use Zod `safeParse` and return 400 with Zod error issues on failure.
- **DTOs**: Inferred from Zod schemas via `z.infer<typeof schema>`. Defined in `<module>.schemas.ts`.
- **Prisma client**: Generated to `src/generated/prisma/` (not the default `node_modules/.prisma/client`). Always import from `../../generated/prisma/client`, never from `@prisma/client`.
- **Prisma singleton**: `src/core/prismaSingleton.ts` — import this everywhere, never instantiate `PrismaClient` directly.
- **P2025 handling**: `updateById` and `deleteById` operations catch `PrismaClientKnownRequestError` with code `P2025` (record not found) and return `null`; controllers map `null` to 404.
- **Status codes**: New modules follow REST conventions — 201 on create, 200 on read/update, 204 on delete, 400 on bad input, 401 on missing/invalid auth, 404 on not found, 409 on conflict, 500 on unexpected. The existing `posts` module returns `200 + { message }` on delete (legacy) — there's a `CHANGEFLAG` comment in `posts.controller.ts` noting the planned migration to 204.

## Data models (summary)

- `Profile` — id is the Supabase auth UUID (not auto-generated), has unique `username`
- `Post` — belongs to `Profile` (author) and `Community`; has `comments` and `votes`
- `Comment` — belongs to `Post` and `Profile`; has `votes`
- `Community` — has unique `name`, owns posts (cascade delete)
- `PostVote` / `CommentVote` — unique per (entity, user) pair; `value` is an Int (upvote/downvote)

## Environment variables

Required in `.env`:

```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

## Prisma workflow

After schema changes:

```bash
npx prisma migrate dev --name <migration_name>
npx prisma generate
```

## Checkpoint — 2026-05-25

The project is being built up incrementally, one file at a time, as a learning exercise. Andre is reviewing each step and wants to understand and defend every line.

### Done so far

- Fixed `timestamp` field: was `BigInt` in Prisma but `z.number().int()` in Zod (would crash on JSON serialization). Migrated to `DateTime` in Prisma and `z.iso.datetime()` in Zod.
- Removed redundant `link` field from Post (was always `post/<uuid>`, duplicating `id`).
- Migration applied: `20260524003926_fix_timestamp_remove_link`.
- Started the `subreddits` module — schemas, service, and controller are done.

### Currently in progress

- Wiring up the `subreddits` module file by file. Next file is `subreddits.router.ts`, then uncomment its import in `src/routers/index.ts`.

### Next steps after subreddits

1. Add `requireAuth` middleware to the post write routes (POST, PATCH, DELETE) in `posts.router.ts`.
2. Remove `authorId` from `createPostSchema` and pull it from `req.user.id` instead — current setup lets a client claim to be any user.
3. Implement the `comments` module (only repository exists — needs schemas, service, controller, router).
4. Implement the `votes` module (only repositories exist — needs schemas, service, controller, router; should use Prisma `upsert` for the vote toggle pattern).
5. Delete `src/modules/votes/postVote.repository copy.ts` (artifact from earlier work — has " copy" in the filename).
6. End-to-end test the full flow with Supabase auth: register a user, get a token, hit the protected endpoints.
