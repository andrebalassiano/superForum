// Factories for preexisting rows a test needs in its "arrange" step. They talk to the
// DB directly (bypassing the API) so tests can set up state without depending on the
// very endpoints they're exercising. A fresh unique suffix avoids @unique collisions.
import prisma from '../../src/core/prismaSingleton';
import type { TestUser } from './auth';

function uniqueSuffix(): string {
    return Math.random().toString(36).slice(2, 10);
}

// A Profile row keyed to a test user's id — the same id the mocked token resolves to,
// which is what the API attributes authorId/ownerId to.
export function makeProfile(user: TestUser, username?: string) {
    return prisma.profile.create({
        data: {
            id: user.id,
            username: username ?? `user_${uniqueSuffix()}`,
        },
    });
}

export function makeCommunity(ownerId: string, name?: string) {
    return prisma.community.create({
        data: {
            name: name ?? `community_${uniqueSuffix()}`,
            owner: { connect: { id: ownerId } },
        },
    });
}

// `score` is settable because a profile's reputation is the sum of these, and building a known
// total out of real votes would need one distinct voter per point. The vote path's own maintenance
// of score is covered by the votes suite; here the score is just arranged state.
export function makePost(
    authorId: string,
    communityId: string,
    overrides?: { title?: string; content?: string; score?: number },
) {
    return prisma.post.create({
        data: {
            title: overrides?.title ?? 'Seed title',
            content: overrides?.content ?? 'Seed content',
            score: overrides?.score ?? 0,
            author: { connect: { id: authorId } },
            community: { connect: { id: communityId } },
        },
    });
}

export function makeComment(authorId: string, postId: string, content = 'Seed comment', score = 0) {
    return prisma.comment.create({
        data: {
            content,
            score,
            author: { connect: { id: authorId } },
            post: { connect: { id: postId } },
        },
    });
}
