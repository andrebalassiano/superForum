import prisma from '../../core/prismaSingleton';

const profilesRepository = {
    // Public profile read. `select` rather than a bare findFirst so the response carries only what a
    // profile page shows — id, username, join date — and a future Profile column cannot leak into a
    // public endpoint by being added to the model. `_count` comes from the same query.
    //
    // Case-insensitive to match the uniqueness rule (migration 20260930000000 indexes
    // lower(username)), so /u/Alice and /u/alice resolve to the same person. findFirst rather than
    // findUnique because Prisma does not treat an insensitive match as a unique lookup.
    async findByUsername(username: string) {
        return prisma.profile.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive',
                },
            },
            select: {
                id: true,
                username: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: true,
                        comments: true,
                    },
                },
            },
        });
    },

    // Net votes received, summed over everything this profile has written. Computed on read rather
    // than denormalized onto Profile: unlike Post.score — which backs ?sort=top and is therefore on
    // a hot path worth maintaining transactionally — this total is read on one page and never sorted
    // by, so a stored counter would be a second source of truth for no gain.
    //
    // Both sums in one transaction so they cannot be split by a vote landing in between. _sum is
    // null when no rows match, which is why the service coalesces.
    async sumScoresByAuthorId(authorId: string) {
        const [posts, comments] = await prisma.$transaction([
            prisma.post.aggregate({ where: { authorId }, _sum: { score: true } }),
            prisma.comment.aggregate({ where: { authorId }, _sum: { score: true } }),
        ]);

        return { posts: posts._sum.score, comments: comments._sum.score };
    },
};

export default profilesRepository;
