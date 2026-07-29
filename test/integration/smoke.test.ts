// Phase-3 gate: proves the whole harness end-to-end — env points at the test DB,
// migrations ran, the Supabase mock resolves the token to a user, the truncate hook
// gives a clean slate, and supertest can drive the real Express app. If this passes,
// expanding to the full per-resource suite is just more of the same.
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { TEST_USERS, authHeader } from '../helpers/auth';
import { makeProfile, makeCommunity } from '../helpers/seed';

describe('smoke: POST /api/posts', () => {
    it('creates a post and attributes authorId to the token user, not the body', async () => {
        await makeProfile(TEST_USERS.alice);
        const community = await makeCommunity(TEST_USERS.alice.id);

        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({
                title: 'Hello world',
                content: 'First post from the test harness',
                timestamp: new Date().toISOString(),
                communityId: community.id,
            });

        expect(res.status).toBe(201);
        expect(res.body.authorId).toBe(TEST_USERS.alice.id);
        expect(res.body.communityId).toBe(community.id);
        expect(res.body.title).toBe('Hello world');
    });

    it('rejects an unauthenticated create with 401', async () => {
        const res = await request(app)
            .post('/api/posts')
            .send({
                title: 'No token',
                content: 'should be rejected',
                timestamp: new Date().toISOString(),
                communityId: '33333333-3333-3333-3333-333333333333',
            });

        expect(res.status).toBe(401);
    });
});