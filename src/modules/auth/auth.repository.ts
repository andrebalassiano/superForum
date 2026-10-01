import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';

const authRepository = {
    async findProfileById(profileId: string) {
        return prisma.profile.findUnique({
            where: {
                id: profileId,
            },
        });
    },

    // Case-insensitive on purpose: uniqueness is enforced on lower(username) by migration
    // 20260930000000, so "alice" and "Alice" are the same name and this has to agree with the
    // database or the pre-insert check would pass and the insert would then fail. findFirst rather
    // than findUnique because an insensitive match isn't a unique lookup as far as Prisma knows.
    async findProfileByUsername(username: string) {
        return prisma.profile.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive',
                },
            },
        });
    },

    async createProfile(data: Prisma.ProfileCreateInput) {
        return prisma.profile.create({
            data,
        });
    },
};

export default authRepository;
