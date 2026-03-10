import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';


const SubredditsRepository = {
    async create(data:Prisma.SubredditCreateInput) {
        return prisma.subreddit.create({
            data,
        });
    },

    async findById(where:Prisma.SubredditWhereUniqueInput) {
        return prisma.subreddit.findUnique({
            where,
        })
    },

    async updateById(where:Prisma.SubredditWhereUniqueInput, 
               data:Prisma.SubredditUpdateInput) {
        return prisma.subreddit.update({
            where,
            data,
        })
    },

    async deleteById(where:Prisma.SubredditWhereUniqueInput) {
        return prisma.subreddit.delete({
            where,
        })
    },
};


export default SubredditsRepository;