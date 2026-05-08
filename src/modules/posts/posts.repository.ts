import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';

const postsRepository = {
    async findAll() {
        return prisma.post.findMany({
            include: {
                author: true,
                subreddit: true,
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

    async create(data: Prisma.PostCreateInput) {
        return prisma.post.create({
            data,
            include: {
                author: true,
                subreddit: true,
            },
        });
    },

    async findById(where: Prisma.PostWhereUniqueInput) {
        return prisma.post.findUnique({
            where,
            include: {
                author: true,
                subreddit: true,
                comments: true,
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });
    },

    async findBySubredditId(subredditId: string) {
        return prisma.post.findMany({
            where: {
                subredditId,
            },
            include: {
                author: true,
                subreddit: true,
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
                subreddit: true,
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