import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';


const communitiesRepository = {
    async create(data:Prisma.CommunityCreateInput) {
        return prisma.community.create({
            data,
        });
    },

    async findById(where:Prisma.CommunityWhereUniqueInput) {
        return prisma.community.findUnique({
            where,
        })
    },

    async updateById(where:Prisma.CommunityWhereUniqueInput,
               data:Prisma.CommunityUpdateInput) {
        return prisma.community.update({
            where,
            data,
        })
    },

    async deleteById(where:Prisma.CommunityWhereUniqueInput) {
        return prisma.community.delete({
            where,
        })
    },
};


export default communitiesRepository;