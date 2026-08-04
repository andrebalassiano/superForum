# superForum

[![CI](https://github.com/andrebalassiano/superForum/actions/workflows/ci.yml/badge.svg)](https://github.com/andrebalassiano/superForum/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/andrebalassiano/superForum/branch/main/graph/badge.svg)](https://codecov.io/gh/andrebalassiano/superForum)

superForum is a Reddit-style forum API. It lets people register, spin up communities, write posts and comments, and vote on them. It's a REST backend written in TypeScript on Express 5, with Prisma 7 talking to a Postgres database and Supabase handling authentication. Every write is authenticated with a server-verified JWT and validated with Zod before it reaches the database.

I built it partly as a learning project and partly as a reference for how I like to structure a Node backend, so the emphasis throughout is on a clean, predictable layout rather than clever shortcuts.

## How it's organized

Each feature lives in its own module under `src/modules` — `auth`, `communities`, `posts`, `comments`, and `votes` — and every module is split into the same four layers. A router declares the routes and hangs the middleware off them. A controller deals with the request and response and nothing else. A service holds the actual business logic. A repository is the only place that talks to Prisma. So a request flows router → controller → service → repository on the way in, and back out the same way.

The point of that separation is that each layer only knows about the one beneath it. The controller doesn't know Prisma exists; the repository doesn't know what an HTTP status code is. It makes the code easy to follow and easy to test a layer at a time. The shared middleware — the two auth guards and the Zod validators — lives in `src/middleware` and gets composed onto routes as needed. The app itself is small: `src/app.ts` builds the Express app and mounts everything under `/api`, and `src/server.ts` starts it on port 3000.

## The API

Routes are grouped by resource. Reads are generally public; writes require a bearer token. A handful of read routes sit in between — they work fine anonymously, but if you send a valid token they'll personalize the response (for example, telling you how you already voted on a post). I'll call those out below.

**Auth and profiles.** `POST /auth/profile` creates the signed-in user's profile row, `GET /auth/me` returns it, and `GET /auth/profiles/:id` looks up any profile by id (public).

**Communities.** `POST /communities` creates one; `GET /communities/:id` reads it (public); `PATCH` and `DELETE` on the same path update and remove it.

**Posts.** `GET /posts` lists them and `GET /posts/:id` reads one — both public, both enriched with your current vote if you're authenticated. `POST /posts` creates a post, and `PATCH`/`DELETE /posts/:id` edit and remove it.

**Comments.** A comment belongs to a post, so it's created under one: `POST /posts/:postId/comments`, with the post id in the URL rather than the body. `GET /posts/:postId/comments` lists a post's comments. A single comment is read at `GET /comments/:id` (public, vote-enriched if authenticated), and `PATCH`/`DELETE /comments/:id` edit and remove it.

**Votes.** Voting is idempotent. `PUT /posts/:postId/vote` sets your vote to either `1` or `-1` — it's an upsert underneath, so calling it again just overwrites your previous vote — and `DELETE /posts/:postId/vote` takes it back. Comments work identically at `/comments/:commentId/vote`. There's deliberately no "zero" vote: removing a vote is a `DELETE`, which keeps the votes table free of meaningless zero rows.

Every write route (and everything above marked as requiring auth) goes through the same JWT check, and every route with a body or an id in the URL is validated by Zod first.

## Try it in Postman

The full request collection lives in [`postman/`](postman/superForum.postman_collection.json) — an end-to-end walkthrough (sign in → community → post → comment → vote → teardown), with the requests ordered as a resource lifecycle so it runs top to bottom in a single pass. Import that file into Postman, then create an environment with `baseUrl` set to `http://localhost:3000/api` plus your `supabaseUrl` and `supabaseKey`; the collection captures the auth token and the record ids automatically as it runs. It can also run headless with `newman`.

## A few decisions worth explaining

The one I care most about is that **a user's identity always comes from their token, never from the request body.** When you create a post or a comment, there's no `authorId` field to send — the server pulls it from the verified JWT. An earlier version trusted an `authorId` in the body, which meant anyone could post as anyone else; pulling it from the token closes that hole.

Identity is only half of it. The other half is **ownership: you can only change your own things.** Editing or deleting a post or comment checks that your id matches the author's, and a community checks it against its owner. When it doesn't match, the answer is a 403 rather than a 404 — the difference between "that isn't yours" and "that doesn't exist" stays honest instead of collapsing into one status. The check lives in the service layer, which fetches the row and compares before it writes anything.

There are **two auth middlewares** rather than one. `requireAuth` is the strict gate: no valid token, no entry, straight to 401. `optionalAuth` is softer — it attaches the user if there's a valid token but waves everyone else through as anonymous. That's what lets the public feed keep working for someone whose session just expired, while still personalizing it for signed-in readers.

**Validation happens at the edge.** The Zod schemas run as middleware before any handler code, so a controller never has to defend against a malformed body — by the time it runs, the input is already the right shape. The same schemas also generate the TypeScript types via `z.infer`, so there's a single source of truth for both the runtime check and the compile-time type.

A couple of smaller things: there's **one shared Prisma client** (in `src/core/prismaSingleton.ts`) using the direct-connection `PrismaPg` adapter, rather than new clients scattered around. And **"not found" is handled deliberately** — the repository catches Prisma's `P2025` error and returns `null` instead of letting it throw, and the controller turns that `null` into a 404. Database errors get translated into HTTP responses rather than leaking out raw.

## The data model

A **Profile** is keyed by the user's Supabase auth UUID rather than a generated id, and has a unique username. A **Post** belongs to a profile (its author) and a community, and owns its comments and votes. A **Comment** belongs to a post and a profile. A **Community** has a unique name and owns its posts, which cascade-delete with it. **PostVote** and **CommentVote** are each unique per user-and-target pair, with a `value` of `1` or `-1`. The full schema, with its indexes and cascade rules, is in `prisma/schema.prisma`.

## Running it locally

You'll need Node 18 or newer and a Supabase project for the Postgres database and auth.

```bash
npm install
cp .env.example .env      # then fill in the values
npx prisma migrate dev    # apply migrations
npx prisma generate       # generate the Prisma client
npm run dev               # starts on http://localhost:3000
```

The `.env.example` file explains where each value comes from. In short: `DATABASE_URL` is the pooled Postgres connection used at runtime, `DIRECT_URL` is the direct connection Prisma uses for migrations, and `SUPABASE_URL` plus `SUPABASE_PUBLISHABLE_KEY` point at the Supabase project for auth.

One thing to know: the Prisma client is generated into `src/generated/prisma` rather than the usual `node_modules` location, so `npx prisma generate` isn't optional — skip it and the imports won't resolve.

## Tests

The suite is written with Vitest and supertest, and it drives the real Express app end to end: every test fires an actual HTTP request and checks both the response and the state left in the database. Rather than reach out to Supabase over the network, it mocks the auth boundary so a known test user resolves straight from the bearer token — that keeps the tests fast and free of real credentials. It runs against a throwaway Postgres (a Docker container locally, a service container in CI), migrated fresh and truncated between tests so each one starts from an empty database.

```bash
docker compose -f docker-compose.test.yml up -d   # throwaway Postgres on :5433
cp .env.test.example .env.test
npm test                                          # or: npm run test:coverage
```

The same suite runs on every push and pull request through GitHub Actions — that's what the CI and coverage badges at the top report.

There's also an opt-in **real-token** lane (`npm run test:realtoken`) that skips the mock entirely: it signs a real user into Supabase, gets a genuine JWT, and drives it through the auth middleware for real. It's gated on credentials — without a `.env.test.realtoken` it simply skips, so the default run and CI never need secrets.

## Still to come

The core is complete and covered by tests. The main thing I'd reach for next is pagination on the list endpoints — `GET /posts` and a post's comments currently return everything, which is fine at this size but is the obvious next step for anything resembling a real feed.

## Credits

Built by Andre Balassiano and Luiz Tatemoto. I wrote the auth, communities, comments, and votes modules along with the shared middleware layer.

## License

ISC
