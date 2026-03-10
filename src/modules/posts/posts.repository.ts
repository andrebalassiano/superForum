import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';

const PostsRepository = {
    async findAll() {
        return prisma.post.findMany({
            include: {
                author: true,
                subreddit: true,
                comments: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });
    },

    async create(data:Prisma.PostCreateInput) {
        return prisma.post.create({
            data,
        });
    },

    async findById(where:Prisma.PostWhereUniqueInput) {
        return prisma.post.findUnique({
            where,
        });
    },

    async findBySubredditId(subredditId:string) {
        return prisma.post.findMany({
            where: {
                subredditId: subredditId,
            },
        });
    },

    async updateById(where:Prisma.PostWhereUniqueInput, 
                    data:Prisma.PostUpdateInput) {
        return prisma.post.update({
            where,
            data,
        })
    },

    async deleteById(where:Prisma.PostWhereUniqueInput) {
        return prisma.post.delete({
            where,
        })
    },




}


export default PostsRepository;