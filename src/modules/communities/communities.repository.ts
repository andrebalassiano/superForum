import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';
import { PaginationQueryDTO } from '../../core/pagination';

const communitiesRepository = {
    async create(data: Prisma.CommunityCreateInput) {
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

    // `_count.posts` rides along because two callers need it: the delete gate (a community with
    // posts in it can't be removed) and the client, which disables the button and says why rather
    // than offering an action the API will refuse.
    async findById(where: Prisma.CommunityWhereUniqueInput) {
        return prisma.community.findUnique({
            where,
            include: {
                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
        });
    },

    async updateById(where: Prisma.CommunityWhereUniqueInput, data: Prisma.CommunityUpdateInput) {
        return prisma.community.update({
            where,
            data,
        });
    },

    async deleteById(where: Prisma.CommunityWhereUniqueInput) {
        return prisma.community.delete({
            where,
        });
    },
};

export default communitiesRepository;
