// The profile page's three endpoints: the entity, and its two tabs.
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { TEST_USERS, authHeader } from '../helpers/auth';
import { makeProfile, makeCommunity, makePost, makeComment } from '../helpers/seed';

describe('profiles: GET /api/profiles/:username', () => {
    it('returns a public profile with its counts, no auth required', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');
        const community = await makeCommunity(TEST_USERS.alice.id);
        const post = await makePost(TEST_USERS.alice.id, community.id);
        await makeComment(TEST_USERS.alice.id, post.id);

        const res = await request(app).get('/api/profiles/alice');

        expect(res.status).toBe(200);
        expect(res.body.username).toBe('alice');
        expect(res.body.id).toBe(TEST_USERS.alice.id);
        expect(res.body.createdAt).toBeDefined();
        expect(res.body._count).toEqual({ posts: 1, comments: 1 });
    });

    // Uniqueness is enforced on lower(username), so the URL has to resolve the same way or
    // /u/Alice would 404 for a user who typed their name with a capital.
    it('resolves the username case-insensitively', async () => {
        await makeProfile(TEST_USERS.alice, 'MayaBuilds');

        const res = await request(app).get('/api/profiles/mayabuilds');

        expect(res.status).toBe(200);
        expect(res.body.username).toBe('MayaBuilds');
    });

    it('returns 404 for an unknown username', async () => {
        const res = await request(app).get('/api/profiles/nobody');

        expect(res.status).toBe(404);
    });

    // The response is built with an explicit select, so adding a column to Profile cannot quietly
    // publish it on a public endpoint. updatedAt is the one the model has today.
    it('exposes only the public columns', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');

        const res = await request(app).get('/api/profiles/alice');

        expect(Object.keys(res.body).sort()).toEqual([
            '_count',
            'createdAt',
            'id',
            'reputation',
            'username',
        ]);
    });

    it('sums reputation across posts and comments', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');
        const community = await makeCommunity(TEST_USERS.alice.id);
        const post = await makePost(TEST_USERS.alice.id, community.id, { score: 5 });
        await makePost(TEST_USERS.alice.id, community.id, { score: 3 });
        await makeComment(TEST_USERS.alice.id, post.id, 'nice', 2);

        const res = await request(app).get('/api/profiles/alice');

        expect(res.status).toBe(200);
        expect(res.body.reputation).toEqual({ posts: 8, comments: 2, total: 10 });
    });

    // Prisma's _sum is null rather than 0 when no rows match, so without coalescing a brand-new
    // account would report null and the UI would render "null reputation".
    it('reports zero reputation for a profile with nothing written', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');

        const res = await request(app).get('/api/profiles/alice');

        expect(res.body.reputation).toEqual({ posts: 0, comments: 0, total: 0 });
    });

    it('counts downvotes against reputation', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');
        const community = await makeCommunity(TEST_USERS.alice.id);
        await makePost(TEST_USERS.alice.id, community.id, { score: 4 });
        await makePost(TEST_USERS.alice.id, community.id, { score: -6 });

        const res = await request(app).get('/api/profiles/alice');

        expect(res.body.reputation.posts).toBe(-2);
        expect(res.body.reputation.total).toBe(-2);
    });

    // Ties reputation to the real vote path rather than only to arranged score columns: the vote
    // repo maintains Post.score in a transaction, and the aggregate has to see that.
    it('reflects a vote cast through the API', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');
        await makeProfile(TEST_USERS.bob, 'bob');
        const community = await makeCommunity(TEST_USERS.alice.id);
        const post = await makePost(TEST_USERS.alice.id, community.id);

        await request(app)
            .put(`/api/posts/${post.id}/vote`)
            .set('Authorization', authHeader(TEST_USERS.bob))
            .send({ value: 1 });

        const res = await request(app).get('/api/profiles/alice');

        expect(res.body.reputation.total).toBe(1);
    });
});

describe('profiles: GET /api/profiles/:username/posts', () => {
    it('returns only that author’s posts, in the paginated envelope', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');
        await makeProfile(TEST_USERS.bob, 'bob');
        const community = await makeCommunity(TEST_USERS.alice.id);
        await makePost(TEST_USERS.alice.id, community.id, { title: 'by alice' });
        await makePost(TEST_USERS.bob.id, community.id, { title: 'by bob' });

        const res = await request(app).get('/api/profiles/alice/posts');

        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].title).toBe('by alice');
        expect(res.body.nextCursor).toBeNull();
    });

    it('returns 404 for an unknown username', async () => {
        const res = await request(app).get('/api/profiles/nobody/posts');

        expect(res.status).toBe(404);
    });

    it('returns an empty page for an author with no posts', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');

        const res = await request(app).get('/api/profiles/alice/posts');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ items: [], nextCursor: null });
    });

    it('honours ?sort=top', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');
        const community = await makeCommunity(TEST_USERS.alice.id);
        await makePost(TEST_USERS.alice.id, community.id, { title: 'low', score: 1 });
        await makePost(TEST_USERS.alice.id, community.id, { title: 'high', score: 9 });

        const res = await request(app).get('/api/profiles/alice/posts?sort=top');

        expect(res.body.items.map((p: { title: string }) => p.title)).toEqual(['high', 'low']);
    });

    it('folds in currentUserVote for a signed-in caller', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');
        await makeProfile(TEST_USERS.bob, 'bob');
        const community = await makeCommunity(TEST_USERS.alice.id);
        const post = await makePost(TEST_USERS.alice.id, community.id);

        await request(app)
            .put(`/api/posts/${post.id}/vote`)
            .set('Authorization', authHeader(TEST_USERS.bob))
            .send({ value: -1 });

        const res = await request(app)
            .get('/api/profiles/alice/posts')
            .set('Authorization', authHeader(TEST_USERS.bob));

        expect(res.body.items[0].currentUserVote).toBe(-1);
    });

    it('pages with ?limit and ?cursor', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');
        const community = await makeCommunity(TEST_USERS.alice.id);
        await makePost(TEST_USERS.alice.id, community.id);
        await makePost(TEST_USERS.alice.id, community.id);

        const first = await request(app).get('/api/profiles/alice/posts?limit=1');

        expect(first.body.items).toHaveLength(1);
        expect(first.body.nextCursor).not.toBeNull();

        const second = await request(app).get(
            `/api/profiles/alice/posts?limit=1&cursor=${first.body.nextCursor}`,
        );

        expect(second.body.items).toHaveLength(1);
        expect(second.body.items[0].id).not.toBe(first.body.items[0].id);
    });
});

describe('profiles: GET /api/profiles/:username/comments', () => {
    it('returns that author’s comments with the parent post to link to', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');
        const community = await makeCommunity(TEST_USERS.alice.id);
        const post = await makePost(TEST_USERS.alice.id, community.id, { title: 'the thread' });
        await makeComment(TEST_USERS.alice.id, post.id, 'my reply');

        const res = await request(app).get('/api/profiles/alice/comments');

        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].content).toBe('my reply');
        // without this a comment on a profile page has nowhere to link and nothing to label it
        expect(res.body.items[0].post).toEqual({ id: post.id, title: 'the thread' });
    });

    it('excludes another author’s comments on the same post', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');
        await makeProfile(TEST_USERS.bob, 'bob');
        const community = await makeCommunity(TEST_USERS.alice.id);
        const post = await makePost(TEST_USERS.alice.id, community.id);
        await makeComment(TEST_USERS.alice.id, post.id, 'alice said');
        await makeComment(TEST_USERS.bob.id, post.id, 'bob said');

        const res = await request(app).get('/api/profiles/bob/comments');

        expect(res.body.items).toHaveLength(1);
        expect(res.body.items[0].content).toBe('bob said');
    });

    it('returns 404 for an unknown username', async () => {
        const res = await request(app).get('/api/profiles/nobody/comments');

        expect(res.status).toBe(404);
    });

    it('returns an empty page for an author with no comments', async () => {
        await makeProfile(TEST_USERS.alice, 'alice');

        const res = await request(app).get('/api/profiles/alice/comments');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ items: [], nextCursor: null });
    });
});
