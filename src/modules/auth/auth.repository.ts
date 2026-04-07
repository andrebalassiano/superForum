import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';

const AuthRepository = {
    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: {
                email,
            },
        });
    },

    async findById(userId: string) {
        return prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
    },

    async createUser(data: Prisma.UserCreateInput) {
        return prisma.user.create({
            data,
        });
    },
}

// methods to add/consider later:
// findByUsername
//
// updatePasswordById
//
// storeRefreshToken
// findByRefreshToken
// deleteRefreshToken
// revokeRefreshToken
//
// updateUserById
// deleteUserById


export default AuthRepository;