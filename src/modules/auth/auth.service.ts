import authRepository from './auth.repository';
import { Prisma } from '../../generated/prisma/client';

const authService = {
    async createProfile(profileId: string, username: string) {
        const existingUsername = await authRepository.findProfileByUsername(username);

        if (existingUsername) {
            return null;
        }

        const data: Prisma.ProfileCreateInput = {
            id: profileId,
            username,
        };

        return await authRepository.createProfile(data);
    },

    async getProfileById(profileId: string) {
        return await authRepository.findProfileById(profileId);
    },
};

export default authService;
