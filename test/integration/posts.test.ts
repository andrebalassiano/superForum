import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app';
import { TEST_USERS, authHeader } from '../helpers/auth';
import { makeProfile, makeCommunity, makePost } from '../helpers/seed';
import prisma from '../../src/core/prismaSingleton';

// Alice authors content; Bob is a second real user used for the ownership (403) paths.
// Both need a Profile row, and Alice needs a Community to post into.
async function arrange() {
    await makeProfile(TEST_USERS.alice, 'alice');
    await makeProfile(TEST_USERS.bob, 'bob');
    const community = await makeCommunity(TEST_USERS.alice.id);
    return { community };
}

function validPostBody(communityId: string) {
    return {
        title: 'A title',
        content: 'Some content',
        communityId,
    };
}

describe('posts: POST /api/posts', () => {
    let communityId: string;
    beforeEach(async () => {
        communityId = (await arrange()).community.id;
    });

    it('creates a post with authorId from the token', async () => {
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send(validPostBody(communityId));

        expect(res.status).toBe(201);
        expect(res.body.authorId).toBe(TEST_USERS.alice.id);
    });

    it('returns 401 without a token', async () => {
        const res = await request(app).post('/api/posts').send(validPostBody(communityId));
        expect(res.status).toBe(401);
    });

    it('returns 400 on an unknown key (.strict), wrapped in the error envelope', async () => {
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ ...validPostBody(communityId), sneaky: true });

        expect(res.status).toBe(400);
        // consistent envelope: { error: { message, details } } — details carries the Zod issues
        expect(res.body.error.message).toBeDefined();
        expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it('returns 400 on an empty title', async () => {
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ ...validPostBody(communityId), title: '   ' });

        expect(res.status).toBe(400);
    });

    it('returns 404 when communityId references no community', async () => {
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send(validPostBody(randomUUID()));

        expect(res.status).toBe(404);
    });
});

describe('posts: create when the author has no profile', () => {
    it('returns 404 with a profile message, not "Community not found"', async () => {
        // Only Alice gets a profile + community. Bob is authenticated (token resolves) but
        // never created a profile — so the failure is the author connect, not the community.
        await makeProfile(TEST_USERS.alice, 'alice');
        const community = await makeCommunity(TEST_USERS.alice.id);

        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', authHeader(TEST_USERS.bob))
            .send(validPostBody(community.id));

        expect(res.status).toBe(404);
        expect(res.body.error.message).toMatch(/profile/i);
    });
});

describe('posts: reads', () => {
    it('GET /api/posts returns a paginated envelope', async () => {
        const { community } = await arrange();
        await makePost(TEST_USERS.alice.id, community.id);

        const res = await request(app).get('/api/posts');
        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(1);
        expect(res.body.nextCursor).toBeNull();
    });

    it('GET /api/posts/:id returns the post', async () => {
        const { community } = await arrange();
        const post = await makePost(TEST_USERS.alice.id, community.id);

        const res = await request(app).get(`/api/posts/${post.id}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(post.id);
    });

    it('GET /api/posts/:id returns 404 for a missing post', async () => {
        const res = await request(app).get(`/api/posts/${randomUUID()}`);
        expect(res.status).toBe(404);
    });

    it('GET /api/posts/:id returns 400 for a non-UUID id', async () => {
        const res = await request(app).get('/api/posts/not-a-uuid');
        expect(res.status).toBe(400);
    });
});

describe('posts: pagination', () => {
    it('walks every post via the cursor with no dupes or gaps', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');
        const community = await makeCommunity(TEST_USERS.alice.id);
        const created: string[] = [];
        for (let i = 0; i < 3; i++) {
            created.push((await makePost(TEST_USERS.alice.id, community.id, { title: `p${i}` })).id);
        }

        const page1 = await request(app).get('/api/posts?limit=2');
        expect(page1.status).toBe(200);
        expect(page1.body.items).toHaveLength(2);
        expect(page1.body.nextCursor).toBeTruthy();

        const page2 = await request(app).get(`/api/posts?limit=2&cursor=${page1.body.nextCursor}`);
        expect(page2.status).toBe(200);
        expect(page2.body.items).toHaveLength(1);
        expect(page2.body.nextCursor).toBeNull();

        const seen = [...page1.body.items, ...page2.body.items].map((p: { id: string }) => p.id);
        expect(new Set(seen)).toEqual(new Set(created));
    });

    it('returns 400 on an out-of-range limit', async () => {
        const res = await request(app).get('/api/posts?limit=0');
        expect(res.status).toBe(400);
    });

    it('returns 400 on a non-numeric limit', async () => {
        const res = await request(app).get('/api/posts?limit=abc');
        expect(res.status).toBe(400);
    });
});

describe('posts: sort', () => {
    it('?sort=top orders posts by score descending', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');
        const community = await makeCommunity(TEST_USERS.alice.id);
        const low = await makePost(TEST_USERS.alice.id, community.id, { title: 'low' });
        const high = await makePost(TEST_USERS.alice.id, community.id, { title: 'high' });
        const mid = await makePost(TEST_USERS.alice.id, community.id, { title: 'mid' });
        await prisma.post.update({ where: { id: high.id }, data: { score: 10 } });
        await prisma.post.update({ where: { id: mid.id }, data: { score: 5 } });

        const res = await request(app).get('/api/posts?sort=top&limit=10');
        expect(res.status).toBe(200);
        expect(res.body.items.map((p: { id: string }) => p.id)).toEqual([high.id, mid.id, low.id]);
    });

    it('returns 400 on an invalid sort value', async () => {
        const res = await request(app).get('/api/posts?sort=banana');
        expect(res.status).toBe(400);
    });
});

describe('posts: ownership on PATCH/DELETE', () => {
    it('lets the author update their own post', async () => {
        const { community } = await arrange();
        const post = await makePost(TEST_USERS.alice.id, community.id);

        const res = await request(app)
            .patch(`/api/posts/${post.id}`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ title: 'Edited' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Edited');
    });

    it('forbids a non-author from updating (403)', async () => {
        const { community } = await arrange();
        const post = await makePost(TEST_USERS.alice.id, community.id);

        const res = await request(app)
            .patch(`/api/posts/${post.id}`)
            .set('Authorization', authHeader(TEST_USERS.bob))
            .send({ title: 'Hijacked' });

        expect(res.status).toBe(403);
    });

    it('returns 404 when updating a missing post', async () => {
        await arrange();
        const res = await request(app)
            .patch(`/api/posts/${randomUUID()}`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ title: 'Nope' });

        expect(res.status).toBe(404);
    });

    it('lets the author delete their own post (204)', async () => {
        const { community } = await arrange();
        const post = await makePost(TEST_USERS.alice.id, community.id);

        const res = await request(app)
            .delete(`/api/posts/${post.id}`)
            .set('Authorization', authHeader(TEST_USERS.alice));

        expect(res.status).toBe(204);
    });

    it('forbids a non-author from deleting (403)', async () => {
        const { community } = await arrange();
        const post = await makePost(TEST_USERS.alice.id, community.id);

        const res = await request(app)
            .delete(`/api/posts/${post.id}`)
            .set('Authorization', authHeader(TEST_USERS.bob));

        expect(res.status).toBe(403);
    });
});