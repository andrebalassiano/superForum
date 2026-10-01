import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { TEST_USERS, authHeader } from '../helpers/auth';
import { makeProfile } from '../helpers/seed';

describe('auth: POST /api/auth/profile', () => {
    it("creates the caller's profile keyed to the token user id", async () => {
        const res = await request(app)
            .post('/api/auth/profile')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ username: 'alice' });

        expect(res.status).toBe(201);
        expect(res.body.id).toBe(TEST_USERS.alice.id);
        expect(res.body.username).toBe('alice');
    });

    it('rejects an unauthenticated create with 401', async () => {
        const res = await request(app).post('/api/auth/profile').send({ username: 'nobody' });

        expect(res.status).toBe(401);
    });

    it('returns 409 when the username is already taken', async () => {
        await makeProfile(TEST_USERS.bob, 'taken');

        const res = await request(app)
            .post('/api/auth/profile')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ username: 'taken' });

        expect(res.status).toBe(409);
    });

    // Uniqueness is enforced on lower(username) (migration 20260930000000), so a name that differs
    // only in case is the same name. Without this, "alice" and "Alice" would be two accounts whose
    // profile URLs look identical to a reader.
    it('returns 409 when the username is taken in a different case', async () => {
        await makeProfile(TEST_USERS.bob, 'Taken');

        const res = await request(app)
            .post('/api/auth/profile')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ username: 'taken' });

        expect(res.status).toBe(409);
    });

    it('stores the username with the casing the caller sent', async () => {
        const res = await request(app)
            .post('/api/auth/profile')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ username: 'MayaBuilds' });

        expect(res.status).toBe(201);
        expect(res.body.username).toBe('MayaBuilds');
    });

    it('rejects an unknown key with 400 (.strict)', async () => {
        const res = await request(app)
            .post('/api/auth/profile')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ username: 'alice', role: 'admin' });

        expect(res.status).toBe(400);
    });

    it('rejects an empty username with 400', async () => {
        const res = await request(app)
            .post('/api/auth/profile')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ username: '   ' });

        expect(res.status).toBe(400);
    });
});

describe('auth: GET /api/auth/me', () => {
    it("returns the authenticated caller's own profile", async () => {
        await makeProfile(TEST_USERS.alice, 'alice');

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', authHeader(TEST_USERS.alice));

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(TEST_USERS.alice.id);
    });

    it('returns 401 without a token', async () => {
        const res = await request(app).get('/api/auth/me');

        expect(res.status).toBe(401);
    });

    it('returns 404 when the authenticated user has no profile row yet', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', authHeader(TEST_USERS.alice));

        expect(res.status).toBe(404);
    });
});
