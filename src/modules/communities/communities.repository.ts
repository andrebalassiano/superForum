import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';
import { PaginationQueryDTO } from '../../core/pagination';


const communitiesRepository = {
    async create(data:Prisma.CommunityCreateInput) {
        return prisma.community.create({
            data,
        });
    },

    // Cursor-paginated list, same shape as posts.findAll: (createdAt desc, id desc), take limit+1.
    async findAll(pagination: PaginationQueryDTO) {
        const { limit, cursor } = pagination;
        return prisma.community.findMany({
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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