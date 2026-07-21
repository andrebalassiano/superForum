import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';

const postsRepository = {
    // When userId is supplied, attach that user's vote on each post via a filtered include — one
    // query, no N+1. The compound unique (postId, userId) guarantees 0 or 1 votes per post per user.
    async findAll(userId?: string) {
        return prisma.post.findMany({
            include: {
                author: true,
                community: true,
                _count: {
                    select: {
                        comments: true,
                    },
                },
                ...(userId
                    ? { votes: { where: { userId }, select: { value: true } } }
                    : {}),
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },

    async create(data: Prisma.PostCreateInput) {
        return prisma.post.create({
            data,
            include: {
                author: true,
                community: true,
            },
        });
    },

    // Same userId-as-filtered-include pattern as findAll — single query carries the caller's vote.
    async findById(where: Prisma.PostWhereUniqueInput, userId?: string) {
        return prisma.post.findUnique({
            where,
            include: {
                author: true,
                community: true,
                comments: true,
                _count: {
                    select: {
                        comments: true,
                    },
                },
                ...(userId
                    ? { votes: { where: { userId }, select: { value: true } } }
                    : {}),
            },
        });
    },

    async findByCommunityId(communityId: string) {
        return prisma.post.findMany({
            where: {
                communityId,
            },
            include: {
                author: true,
                community: true,
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },

    async updateById(where: Prisma.PostWhereUniqueInput, 
                    data: Prisma.PostUpdateInput) {
        return prisma.post.update({
            where,
            data,
            include: {
                author: true,
                community: true,
                comments: true,
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
}


export default postsRepository;