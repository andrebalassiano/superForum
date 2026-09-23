# superForum — web client

The React single-page client for superForum, live at [superforum.vercel.app](https://superforum.vercel.app). It's a self-contained project: its own dependencies, its own TypeScript config, its own linter. The API it talks to lives at the repository root.

React with TypeScript, built by Vite. Routing is React Router, server state is TanStack Query, auth is `@supabase/supabase-js`, and styling is Tailwind over a small set of semantic design tokens.

```bash
npm install
cp .env.example .env.local   # the Supabase project URL and publishable key
npm run dev                  # starts on http://localhost:5173
```

The API has to be running too (`npm run dev` at the repository root, on port 3000) — the client reads from it, and the API's CORS allowlist already expects the Vite dev server's origin. Only `VITE_`-prefixed variables reach browser code, and everything that does is compiled into the bundle, so `.env.local` holds the publishable key and nothing secret.

A deployed build is made with `VITE_API_URL` set to the live API's address; locally it falls back to `http://localhost:3000/api`. That API runs on Render's free tier, which sleeps after about fifteen minutes idle, so the first load after a quiet spell can take up to a minute while it wakes — the skeleton placeholders cover the wait, and it's normal speed after that.

```bash
npm run build     # type-check and bundle to dist/
npm run lint      # oxlint
npm test          # Vitest + React Testing Library (npm run test:watch to keep it open)
```

The tests run in jsdom against a helper that supplies the three things most components assume above them — a router, a query client, and the auth context — and they mock `src/api.ts`, so nothing reaches the network. Where a component's real behaviour is a cache write rather than a rendered value, as with optimistic voting, the assertions are against the query cache.

The [root README](../README.md) explains the client's design decisions — the two mutation strategies, how auth threads through, and how the theme tokens drive dark mode — alongside the API they're built against.
