import authRepository from './auth.repository';
import { Prisma } from '../../generated/prisma/client';

// Returned by createProfile when the username is taken. The controller maps it to 409.
export const USERNAME_TAKEN = 'USERNAME_TAKEN' as const;

const authService = {
    async createProfile(profileId: string, username: string) {
        const existingUsername = await authRepository.findProfileByUsername(username);

        if (existingUsername) {
            return USERNAME_TAKEN;
        }

        const data: Prisma.ProfileCreateInput = {
            id: profileId,
            username,
        };

        try {
            return await authRepository.createProfile(data);
        } catch (error) {
            // The check above is a read followed by a write, so two simultaneous signups for the
            // same name can both pass it. The unique indexes are what actually hold the rule, and
            // P2002 is the loser of that race — same answer as if the check had caught it.
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return USERNAME_TAKEN;
            }

            throw error;
        }
    },

    async getProfileById(profileId: string) {
        return await authRepository.findProfileById(profileId);
    },
};

export default authService;
