# superForum

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

**Comments.** `POST /comments` creates a comment and `GET /comments/:id` reads one (public, vote-enriched if authenticated). `PATCH` and `DELETE /comments/:id` edit and remove it. There's also `GET /posts/:postId/comments` to list a post's comments.

**Votes.** Voting is idempotent. `PUT /posts/:postId/vote` sets your vote to either `1` or `-1` — it's an upsert underneath, so calling it again just overwrites your previous vote — and `DELETE /posts/:postId/vote` takes it back. Comments work identically at `/comments/:commentId/vote`. There's deliberately no "zero" vote: removing a vote is a `DELETE`, which keeps the votes table free of meaningless zero rows.

Every write route (and everything above marked as requiring auth) goes through the same JWT check, and every route with a body or an id in the URL is validated by Zod first.

## A few decisions worth explaining

The one I care most about is that **a user's identity always comes from their token, never from the request body.** When you create a post or a comment, there's no `authorId` field to send — the server pulls it from the verified JWT. An earlier version trusted an `authorId` in the body, which meant anyone could post as anyone else; pulling it from the token closes that hole.

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

## Still to come

A few things are on the list: enforcing ownership on edits and deletes so people can only change their own content, mapping foreign-key violations to a 404 instead of a 500, and a proper integration test suite over the main endpoints.

## Credits

Built by Andre Balassiano and Luiz Tatemoto. I wrote the auth, communities, comments, and votes modules along with the shared middleware layer.

## License

ISC
