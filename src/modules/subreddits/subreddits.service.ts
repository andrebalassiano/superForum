import SubredditsRepository from './subreddits.repository';
import { Prisma } from '../../generated/prisma/client';
import { CreateSubredditDTO, UpdateSubredditDTO } from './subreddits.schemas';

const subredditsService = {
    // check the name isn't taken first — returning null lets the controller respond with 409 instead of letting Prisma throw on the unique constraint
    async createSubreddit(dto: CreateSubredditDTO) {
        const existing = await SubredditsRepository.findById({ name: dto.name });

        if (existing) {
            return null;
        }

        const data: Prisma.SubredditCreateInput = {
            name: dto.name,
        };

        return await SubredditsRepository.create(data);
    },

    // simple read passthrough — kept here so the controller never talks to the repository directly
    async getSubredditById(id: string) {
        return await SubredditsRepository.findById({ id });
    },

    // build the update payload from only the fields that were sent (PATCH semantics)
    async updateSubreddit(id: string, dto: UpdateSubredditDTO) {
        const data: Prisma.SubredditUpdateInput = {};

        if (dto.name !== undefined) {
            data.name = dto.name;
        }

        // P2025 = "record not found" — catch it and return null so the controller can map to a 404
        try {
            return await SubredditsRepository.updateById({ id }, data);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    },

    // same P2025 trick — delete throws if the row doesn't exist
    async deleteSubreddit(id: string) {
        try {
            return await SubredditsRepository.deleteById({ id });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    },
};

export default subredditsService;
