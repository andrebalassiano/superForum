import authRepository from './auth.repository';
import { RegisterUserDTO, LoginUserDTO } from './auth.schemas';
import { Prisma } from '../../generated/prisma/client';
import { ARGON2_OPTIONS } from './auth.config';
import argon2 from 'argon2';


const authService = {
    async registerUser(dto: RegisterUserDTO) {
        const existingEmail = await authRepository.findByEmail(dto.email);

        if (existingEmail) {
            return null;
        }

        const existingUsername = await authRepository.findByUsername(dto.username);

        if (existingUsername) {
            return null;
        }

        const hashedPassword = await argon2.hash(dto.password, ARGON2_OPTIONS);

        const data: Prisma.UserCreateInput = {
            username: dto.username,
            email: dto.email,
            password: hashedPassword,
        };

        const createdUser = await authRepository.createUser(data);

        const { password, ...safeUser } = createdUser;

        return safeUser;
    },

    async loginUser(dto: LoginUserDTO) {
        const user = await authRepository.findByEmail(dto.email);

        if (!user) {
            return null;
        }

        const isPasswordValid = await argon2.verify(user.password, dto.password);

        if (!isPasswordValid) {
            return null;
        }

        const { password, ...safeUser } = user;

        return safeUser;
    },

    async getUserById(userId: string) {
        const user = await authRepository.findById(userId);

        if (!user) {
            return null;
        }

        const { password, ...safeUser } = user;

        return safeUser;
    },
};

export default authService;