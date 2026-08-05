import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app';
import { TEST_USERS, authHeader } from '../helpers/auth';
import { makeProfile, makeCommunity, makePost } from '../helpers/seed';

beforeEach(async () => {
    await makeProfile(TEST_USERS.alice, 'alice');
    await makeProfile(TEST_USERS.bob, 'bob');
});

describe('communities: POST /api/communities', () => {
    it('creates a community with ownerId from the token', async () => {
        const res = await request(app)
            .post('/api/communities')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ name: 'askreddit' });

        expect(res.status).toBe(201);
        expect(res.body.ownerId).toBe(TEST_USERS.alice.id);
        expect(res.body.name).toBe('askreddit');
    });

    it('returns 401 without a token', async () => {
        const res = await request(app).post('/api/communities').send({ name: 'nope' });
        expect(res.status).toBe(401);
    });

    it('returns 409 on a duplicate name', async () => {
        await makeCommunity(TEST_USERS.alice.id, 'dupe');

        const res = await request(app)
            .post('/api/communities')
            .set('Authorization', authHeader(TEST_USERS.bob))
            .send({ name: 'dupe' });

        expect(res.status).toBe(409);
    });

    it('returns 400 on an unknown key (.strict)', async () => {
        const res = await request(app)
            .post('/api/communities')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ name: 'x', description: 'not a field' });

        expect(res.status).toBe(400);
    });

    it('returns 400 on an empty name', async () => {
        const res = await request(app)
            .post('/api/communities')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ name: '  ' });

        expect(res.status).toBe(400);
    });
});

describe('communities: reads', () => {
    it('GET /api/communities returns a paginated envelope', async () => {
        await makeCommunity(TEST_USERS.alice.id);
        await makeCommunity(TEST_USERS.alice.id);

        const res = await request(app).get('/api/communities');
        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(2);
        expect(res.body.nextCursor).toBeNull();
    });

    it('paginates communities via the cursor', async () => {
        const created: string[] = [];
        for (let i = 0; i < 3; i++) {
            created.push((await makeCommunity(TEST_USERS.alice.id)).id);
        }

        const page1 = await request(app).get('/api/communities?limit=2');
        expect(page1.body.items).toHaveLength(2);
        expect(page1.body.nextCursor).toBeTruthy();

        const page2 = await request(app).get(`/api/communities?limit=2&cursor=${page1.body.nextCursor}`);
        expect(page2.body.items).toHaveLength(1);
        expect(page2.body.nextCursor).toBeNull();

        const seen = [...page1.body.items, ...page2.body.items].map((c: { id: string }) => c.id);
        expect(new Set(seen)).toEqual(new Set(created));
    });

    it('GET /api/communities/:id returns the community', async () => {
        const community = await makeCommunity(TEST_USERS.alice.id);
        const res = await request(app).get(`/api/communities/${community.id}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(community.id);
    });

    it('returns 404 for a missing community', async () => {
        const res = await request(app).get(`/api/communities/${randomUUID()}`);
        expect(res.status).toBe(404);
    });

    it('returns 400 for a non-UUID id', async () => {
        const res = await request(app).get('/api/communities/not-a-uuid');
        expect(res.status).toBe(400);
    });
});

describe('communities: ownership on PATCH/DELETE', () => {
    it('lets the owner rename their community', async () => {
        const community = await makeCommunity(TEST_USERS.alice.id, 'before');

        const res = await request(app)
            .patch(`/api/communities/${community.id}`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ name: 'after' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('after');
    });

    it('forbids a non-owner from renaming (403)', async () => {
        const community = await makeCommunity(TEST_USERS.alice.id);

        const res = await request(app)
            .patch(`/api/communities/${community.id}`)
            .set('Authorization', authHeader(TEST_USERS.bob))
            .send({ name: 'hijacked' });

        expect(res.status).toBe(403);
    });

    it('returns 404 when updating a missing community', async () => {
        const res = await request(app)
            .patch(`/api/communities/${randomUUID()}`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ name: 'nope' });

        expect(res.status).toBe(404);
    });

    it('lets the owner delete their community (204)', async () => {
        const community = await makeCommunity(TEST_USERS.alice.id);

        const res = await request(app)
            .delete(`/api/communities/${community.id}`)
            .set('Authorization', authHeader(TEST_USERS.alice));

        expect(res.status).toBe(204);
    });

    it('forbids a non-owner from deleting (403)', async () => {
        const community = await makeCommunity(TEST_USERS.alice.id);

        const res = await request(app)
            .delete(`/api/communities/${community.id}`)
            .set('Authorization', authHeader(TEST_USERS.bob));

        expect(res.status).toBe(403);
    });

    it('cascades: deleting a community removes its posts', async () => {
        const community = await makeCommunity(TEST_USERS.alice.id);
        const post = await makePost(TEST_USERS.alice.id, community.id);

        const del = await request(app)
            .delete(`/api/communities/${community.id}`)
            .set('Authorization', authHeader(TEST_USERS.alice));
        expect(del.status).toBe(204);

        const getPost = await request(app).get(`/api/posts/${post.id}`);
        expect(getPost.status).toBe(404);
    });
});