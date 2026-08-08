// Real-token auth contract. Where the mocked integration suite stubs Supabase at the client
// boundary, this lane proves the boundary for real: it signs a real user into Supabase, gets a
// genuine JWT, and drives it through the app's requireAuth (which calls supabase.auth.getUser).
//
// Gated: if the Supabase creds aren't set (no .env.test.realtoken), the whole describe skips —
// so this never fails a run for lacking credentials, and the default `npm test` never needs them.
// The app is imported dynamically inside beforeAll because supabaseClient throws at import time
// when SUPABASE_URL is missing; a static import would crash the file instead of skipping it.
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const email = process.env.SUPABASE_TEST_EMAIL;
const password = process.env.SUPABASE_TEST_PASSWORD;
const hasCreds = Boolean(url && key && email && password);

describe.skipIf(!hasCreds)('real-token auth contract', () => {
    let app: Express;
    let token: string;
    let userId: string;

    beforeAll(async () => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(url!, key!);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email!,
            password: password!,
        });
        if (error || !data.session) {
            throw new Error(`Supabase sign-in failed: ${error?.message ?? 'no session returned'}`);
        }

        token = data.session.access_token;
        userId = data.user.id;
        app = (await import('../../src/app')).default;
    });

    it('accepts a real Supabase JWT and resolves the caller to their own user id', async () => {
        // The DB is truncated fresh for this test, so create this real user's profile, then read
        // it back through /auth/me — proving req.user.id came out of the verified real token.
        const created = await request(app)
            .post('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: `realtoken_${Date.now()}` });
        expect(created.status).toBe(201);

        const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(me.status).toBe(200);
        expect(me.body.id).toBe(userId);
    });

    it('rejects a malformed token with 401', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer not-a-real-jwt');
        expect(res.status).toBe(401);
    });
});
