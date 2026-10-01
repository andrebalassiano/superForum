import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';
import { PaginationQueryDTO } from '../../core/pagination';

const postsRepository = {
    // When userId is supplied, attach that user's vote on each post via a filtered include — one
    // query, no N+1. The compound unique (postId, userId) guarantees 0 or 1 votes per post per user.
    // Cursor pagination with a feed sort. `top` orders by score, `new` (default) by recency; either
    // way the id tiebreak keeps the ordering total, and take limit+1 lets the service detect a next
    // page. When a cursor is given, seek to it and skip it (skip: 1) so paging never repeats it.
    // `filters` scopes the feed: communityId for GET /communities/:id/posts, authorId for
    // GET /profiles/:username/posts, neither for the global GET /posts. They're one object rather
    // than positional params so the where clause composes instead of one filter shadowing the
    // other, and so a third scope doesn't change the signature again.
    async findAll(
        userId: string | undefined,
        pagination: PaginationQueryDTO & { sort?: 'new' | 'top' },
        filters: { communityId?: string; authorId?: string } = {},
    ) {
        const { limit, cursor, sort } = pagination;
        const { communityId, authorId } = filters;
        const orderBy =
            sort === 'top'
                ? [{ score: 'desc' as const }, { id: 'desc' as const }]
                : [{ createdAt: 'desc' as const }, { id: 'desc' as const }];

        // An empty object is a no-op where in Prisma, so the global feed needs no special case.
        const where: Prisma.PostWhereInput = {
            ...(communityId ? { communityId } : {}),
            ...(authorId ? { authorId } : {}),
        };

        return prisma.post.findMany({
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            where,
            include: {
                author: { select: { username: true } },
                community: true,
                _count: {
                    select: {
                        comments: true,
                    },
                },
                ...(userId ? { votes: { where: { userId }, select: { value: true } } } : {}),
            },
            orderBy,
        });
    },

    async create(data: Prisma.PostCreateInput) {
        return prisma.post.create({
            data,
            include: {
                author: { select: { username: true } },
                community: true,
            },
        });
    },

    // Same userId-as-filtered-include pattern as findAll — single query carries the caller's vote.
    // The thread itself is deliberately NOT included: comments are read through the paginated
    // GET /posts/:postId/comments, so including them here would ship every comment on the post,
    // unbounded and unread, on top of the page the client then fetches properly. Only the count
    // comes along, which is all a post needs to render its own header.
    async findById(where: Prisma.PostWhereUniqueInput, userId?: string) {
        return prisma.post.findUnique({
            where,
            include: {
                author: { select: { username: true } },
                community: true,
                _count: {
                    select: {
                        comments: true,
                    },
                },
                ...(userId ? { votes: { where: { userId }, select: { value: true } } } : {}),
            },
        });
    },

    async updateById(where: Prisma.PostWhereUniqueInput, data: Prisma.PostUpdateInput) {
        return prisma.post.update({
            where,
            data,
            include: {
                author: { select: { username: true } },
                community: true,
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });
    },

    async deleteById(where: Prisma.PostWhereUniqueInput) {
        return prisma.post.delete({
            where,
        });
    },
};

export default postsRepository;
