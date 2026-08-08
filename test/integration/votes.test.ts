import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app';
import { TEST_USERS, authHeader } from '../helpers/auth';
import { makeProfile, makeCommunity, makePost, makeComment } from '../helpers/seed';

let postId: string;
let commentId: string;

// Alice has a profile and owns a post + comment to vote on. Bob is intentionally
// left WITHOUT a profile row so we can exercise the "voter has no profile" 404.
beforeEach(async () => {
    await makeProfile(TEST_USERS.alice, 'alice');
    const community = await makeCommunity(TEST_USERS.alice.id);
    const post = await makePost(TEST_USERS.alice.id, community.id);
    postId = post.id;
    commentId = (await makeComment(TEST_USERS.alice.id, postId)).id;
});

describe('votes: post votes', () => {
    it('PUT sets a vote (200)', async () => {
        const res = await request(app)
            .put(`/api/posts/${postId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ value: 1 });

        expect(res.status).toBe(200);
    });

    it('reflects currentUserVote on the post read for the voter', async () => {
        await request(app)
            .put(`/api/posts/${postId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ value: 1 });

        const read = await request(app)
            .get(`/api/posts/${postId}`)
            .set('Authorization', authHeader(TEST_USERS.alice));

        expect(read.status).toBe(200);
        expect(read.body.currentUserVote).toBe(1);
    });

    it('toggles an existing vote via a second PUT (upsert)', async () => {
        await request(app)
            .put(`/api/posts/${postId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ value: 1 });

        await request(app)
            .put(`/api/posts/${postId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ value: -1 });

        const read = await request(app)
            .get(`/api/posts/${postId}`)
            .set('Authorization', authHeader(TEST_USERS.alice));

        expect(read.body.currentUserVote).toBe(-1);
    });

    it('DELETE removes the vote (204) and clears currentUserVote', async () => {
        await request(app)
            .put(`/api/posts/${postId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ value: 1 });

        const del = await request(app)
            .delete(`/api/posts/${postId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice));
        expect(del.status).toBe(204);

        const read = await request(app)
            .get(`/api/posts/${postId}`)
            .set('Authorization', authHeader(TEST_USERS.alice));
        expect(read.body.currentUserVote).toBeNull();
    });

    it('maintains the post score as the vote is set, switched, and removed', async () => {
        // fresh upvote → +1
        await request(app)
            .put(`/api/posts/${postId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ value: 1 });
        let read = await request(app).get(`/api/posts/${postId}`);
        expect(read.body.score).toBe(1);

        // switch to downvote → -1 (delta of -2)
        await request(app)
            .put(`/api/posts/${postId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ value: -1 });
        read = await request(app).get(`/api/posts/${postId}`);
        expect(read.body.score).toBe(-1);

        // remove → back to 0
        await request(app)
            .delete(`/api/posts/${postId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice));
        read = await request(app).get(`/api/posts/${postId}`);
        expect(read.body.score).toBe(0);
    });

    it('DELETE returns 404 when no vote exists', async () => {
        const res = await request(app)
            .delete(`/api/posts/${postId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice));

        expect(res.status).toBe(404);
    });

    it('returns 400 on an out-of-range value', async () => {
        const res = await request(app)
            .put(`/api/posts/${postId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ value: 2 });

        expect(res.status).toBe(400);
    });

    it('returns 401 without a token', async () => {
        const res = await request(app).put(`/api/posts/${postId}/vote`).send({ value: 1 });
        expect(res.status).toBe(401);
    });

    it('returns 404 when the post does not exist', async () => {
        const res = await request(app)
            .put(`/api/posts/${randomUUID()}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ value: 1 });

        expect(res.status).toBe(404);
    });

    it('returns 404 when the voter has no profile row', async () => {
        // Bob is authenticated (token resolves) but never created a Profile.
        const res = await request(app)
            .put(`/api/posts/${postId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.bob))
            .send({ value: 1 });

        expect(res.status).toBe(404);
        expect(res.body.error.message).toMatch(/profile/i);
    });
});

describe('votes: comment votes', () => {
    it('PUT sets a comment vote (200) and DELETE removes it (204)', async () => {
        const set = await request(app)
            .put(`/api/comments/${commentId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ value: 1 });
        expect(set.status).toBe(200);

        const del = await request(app)
            .delete(`/api/comments/${commentId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice));
        expect(del.status).toBe(204);
    });

    it('maintains the comment score as the vote is set and removed', async () => {
        await request(app)
            .put(`/api/comments/${commentId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ value: 1 });
        let read = await request(app).get(`/api/comments/${commentId}`);
        expect(read.body.score).toBe(1);

        await request(app)
            .delete(`/api/comments/${commentId}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice));
        read = await request(app).get(`/api/comments/${commentId}`);
        expect(read.body.score).toBe(0);
    });

    it('returns 404 when the comment does not exist', async () => {
        const res = await request(app)
            .put(`/api/comments/${randomUUID()}/vote`)
            .set('Authorization', authHeader(TEST_USERS.alice))
            .send({ value: 1 });

        expect(res.status).toBe(404);
    });
});
