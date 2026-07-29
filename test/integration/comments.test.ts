import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app';
import { TEST_USERS, authHeader } from '../helpers/auth';
import { makeProfile, makeCommunity, makePost, makeComment } from '../helpers/seed';

let postId: string;

beforeEach(async () => {
    await makeProfile(TEST_USERS.alice, 'alice');
    await makeProfile(TEST_USERS.bob, 'bob');
    const community = await makeCommunity(TEST_USERS.alice.id);
    postId = (await makePost(TEST_USERS.alice.id, community.id)).id;
});

function validCommentBody(pid: string) {
    return { content: 'A comment', timestamp: new Date().toISOString(), postId: pid };
}

describe('comments: POST /api/comments', () => {
    it('creates a comment with authorId from the token', async () => {
        const res = await request(app)
            .post('/api/comments')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send(validCommentBody(postId));

        expect(res.status).toBe(201);
        expect(res.body.authorId).toBe(TEST_USERS.alice.id);
    });

    it('returns 401 without a token', async () => {
        const res = await request(app).post('/api/comments').send(validCommentBody(postId));
        expect(res.status).toBe(401);
    });

    it('returns 400 on an unknown key (.strict)', async () => {
        const res = await request(app)
            .post('/api/comments')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ ...validCommentBody(postId), authorId: TEST_USERS.bob.id });

        expect(res.status).toBe(400);
    });

    it('returns 400 on empty content', async () => {
        const res = await request(app)
            .post('/api/comments')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ ...validCommentBody(postId), content: '  ' });

        expect(res.status).toBe(400);
    });

    it('returns 404 when postId references no post', async () => {
        const res = await request(app)
            .post('/api/comments')
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send(validCommentBody(randomUUID()));

        expect(res.status).toBe(404);
    });
});

describe('comments: reads', () => {
    it('GET /api/comments/:id returns the comment', async () => {
        const comment = await makeComment(TEST_USERS.alice.id, postId);
        const res = await request(app).get(`/api/comments/${comment.id}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(comment.id);
    });

    it('GET /api/comments/:id returns 404 for a missing comment', async () => {
        const res = await request(app).get(`/api/comments/${randomUUID()}`);
        expect(res.status).toBe(404);
    });

    it('nested GET /api/posts/:postId/comments lists the post\'s comments', async () => {
        await makeComment(TEST_USERS.alice.id, postId, 'one');
        await makeComment(TEST_USERS.bob.id, postId, 'two');

        const res = await request(app).get(`/api/posts/${postId}/comments`);
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
    });

    it('nested list returns an empty array (200) when the post has no comments', async () => {
        const res = await request(app).get(`/api/posts/${postId}/comments`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe('comments: ownership on PATCH/DELETE', () => {
    it('lets the author update their own comment', async () => {
        const comment = await makeComment(TEST_USERS.alice.id, postId);

        const res = await request(app)
            .patch(`/api/comments/${comment.id}`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ content: 'edited' });

        expect(res.status).toBe(200);
        expect(res.body.content).toBe('edited');
    });

    it('forbids a non-author from updating (403)', async () => {
        const comment = await makeComment(TEST_USERS.alice.id, postId);

        const res = await request(app)
            .patch(`/api/comments/${comment.id}`)
            .set('Authorization', authHeader(TEST_USERS.bob))
            .send({ content: 'hijacked' });

        expect(res.status).toBe(403);
    });

    it('lets the author delete their own comment (204)', async () => {
        const comment = await makeComment(TEST_USERS.alice.id, postId);

        const res = await request(app)
            .delete(`/api/comments/${comment.id}`)
            .set('Authorization', authHeader(TEST_USERS.alice));

        expect(res.status).toBe(204);
    });

    it('forbids a non-author from deleting (403)', async () => {
        const comment = await makeComment(TEST_USERS.alice.id, postId);

        const res = await request(app)
            .delete(`/api/comments/${comment.id}`)
            .set('Authorization', authHeader(TEST_USERS.bob));

        expect(res.status).toBe(403);
    });

    it('returns 404 when deleting a missing comment', async () => {
        const res = await request(app)
            .delete(`/api/comments/${randomUUID()}`)
            .set('Authorization', authHeader(TEST_USERS.alice));

        expect(res.status).toBe(404);
    });
});