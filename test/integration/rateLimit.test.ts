// The rate limiter is disabled under NODE_ENV=test on the real app (so the rest of the suite can
// fire freely), so we exercise the factory directly here: a throwaway app with a tiny limit and only
// the method-based skip, wired behind the same errorEnvelope the real app uses. That proves the three
// things that matter — the cap trips a 429, the 429 comes back in the standard error envelope, and
// reads are exempt — without depending on the database or the singleton app.
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import errorEnvelope from '../../src/middleware/errorEnvelope';
import { createRateLimiter } from '../../src/middleware/rateLimiter';

function buildApp() {
    const app = express();
    app.use(errorEnvelope);
    app.use(
        createRateLimiter({
            windowMs: 60_000,
            limit: 2,
            skip: (req) => req.method === 'GET',
        }),
    );
    app.post('/thing', (_req, res) => res.status(201).json({ ok: true }));
    app.get('/thing', (_req, res) => res.status(200).json({ ok: true }));
    return app;
}

describe('rate limiter', () => {
    it('allows writes up to the limit, then answers 429 in the error envelope', async () => {
        const app = buildApp();

        expect((await request(app).post('/thing')).status).toBe(201);
        expect((await request(app).post('/thing')).status).toBe(201);

        const blocked = await request(app).post('/thing');
        expect(blocked.status).toBe(429);
        // same shape as every other error: { error: { message } }
        expect(blocked.body.error.message).toMatch(/too many requests/i);
    });

    it('exempts reads from the limit', async () => {
        const app = buildApp();

        for (let i = 0; i < 5; i++) {
            expect((await request(app).get('/thing')).status).toBe(200);
        }
    });
});
