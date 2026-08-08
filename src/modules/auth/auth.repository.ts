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

    async findProfileByUsername(username: string) {
        return prisma.profile.findUnique({
            where: {
                username,
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
