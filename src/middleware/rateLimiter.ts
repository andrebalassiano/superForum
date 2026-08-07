import { rateLimit, type Options } from 'express-rate-limit';

// Caps how many requests a single client (by IP) may make in a rolling window; over the cap the
// client gets a 429. We key by IP rather than by the authenticated user on purpose: the point is to
// blunt abuse, and an attacker would simply drop their token to dodge a per-user key — the IP is the
// thing you actually want to throttle. (The default keyGenerator already normalizes IPv4/IPv6.)
//
// Exposed as a factory so app.ts can build one limiter from env config while the tests can build a
// throwaway limiter with a tiny limit to exercise the 429 path in isolation.
//
// The 429 body is a plain `{ message }` — the errorEnvelope middleware (mounted before this) reshapes
// it into the standard `{ error: { message } }` envelope, so a rate-limited response looks like every
// other error.
export function createRateLimiter(overrides: Partial<Options> = {}) {
    return rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        limit: Number(process.env.RATE_LIMIT_MAX) || 100,
        standardHeaders: 'draft-8', // advertise the quota via the standard RateLimit-* headers
        legacyHeaders: false, // drop the deprecated X-RateLimit-* headers
        handler: (_req, res) => {
            res.status(429).json({ message: 'Too many requests — please slow down.' });
        },
        ...overrides,
    });
}
