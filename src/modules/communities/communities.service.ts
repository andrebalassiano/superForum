import communitiesRepository from './communities.repository';
import { Prisma } from '../../generated/prisma/client';
import { CreateCommunityDTO, UpdateCommunityDTO } from './communities.schemas';
import { buildPage, PaginationQueryDTO } from '../../core/pagination';


// Returned by update/delete when the caller isn't the community's owner — controller maps it to 403.
// Distinct from null, which means "no such community" → 404.
export const FORBIDDEN = 'FORBIDDEN' as const;

const communitiesService = {
    // check the name isn't taken first — returning null lets the controller respond with 409 instead of letting Prisma throw on the unique constraint
    async createCommunity(ownerId: string, dto: CreateCommunityDTO) {
        const existing = await communitiesRepository.findById({ name: dto.name });

        if (existing) {
            return null;
        }

        const data: Prisma.CommunityCreateInput = {
            name: dto.name,
            // ownerId comes from the authenticated caller (req.user.id), never the request body
            owner: {
                connect: {
                    id: ownerId,
                },
            },
        };

        return await communitiesRepository.create(data);
    },

    // simple read passthrough — kept here so the controller never talks to the repository directly
    async getCommunityById(id: string) {
        return await communitiesRepository.findById({ id });
    },

    // cursor-paginated list → { items, nextCursor } (no per-row reshape; communities have no votes)
    async getAllCommunities(pagination: PaginationQueryDTO) {
        const rows = await communitiesRepository.findAll(pagination);
        return buildPage(rows, pagination.limit);
    },

    // build the update payload from only the fields that were sent (PATCH semantics)
    async updateCommunity(id: string, userId: string, dto: UpdateCommunityDTO) {
        // Ownership gate: only the owner may edit. Fetch first so we can distinguish
        // "no such community" (null → 404) from "not yours" (FORBIDDEN → 403).
        const existing = await communitiesRepository.findById({ id });
        if (!existing) {
            return null;
        }
        if (existing.ownerId !== userId) {
            return FORBIDDEN;
        }

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

    // same ownership gate as updateCommunity
    async deleteCommunity(id: string, userId: string) {
        const existing = await communitiesRepository.findById({ id });
        if (!existing) {
            return null;
        }
        if (existing.ownerId !== userId) {
            return FORBIDDEN;
        }

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