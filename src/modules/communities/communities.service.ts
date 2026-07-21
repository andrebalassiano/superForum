import communitiesRepository from './communities.repository';
import { Prisma } from '../../generated/prisma/client';
import { CreateCommunityDTO, UpdateCommunityDTO } from './communities.schemas';

const communitiesService = {
    // check the name isn't taken first — returning null lets the controller respond with 409 instead of letting Prisma throw on the unique constraint
    async createCommunity(dto: CreateCommunityDTO) {
        const existing = await communitiesRepository.findById({ name: dto.name });

        if (existing) {
            return null;
        }

        const data: Prisma.CommunityCreateInput = {
            name: dto.name,
        };

        return await communitiesRepository.create(data);
    },

    // simple read passthrough — kept here so the controller never talks to the repository directly
    async getCommunityById(id: string) {
        return await communitiesRepository.findById({ id });
    },

    // build the update payload from only the fields that were sent (PATCH semantics)
    async updateCommunity(id: string, dto: UpdateCommunityDTO) {
        const data: Prisma.CommunityUpdateInput = {};

        if (dto.name !== undefined) {
            data.name = dto.name;
        }

        // P2025 = "record not found" — catch it and return null so the controller can map to a 404
        try {
            return await communitiesRepository.updateById({ id }, data);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    },

    // same P2025 trick — delete throws if the row doesn't exist
    async deleteCommunity(id: string) {
        try {
            return await communitiesRepository.deleteById({ id });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    },
};

export default communitiesService;