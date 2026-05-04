import AuthRepository from './auth.repository';
import { RegisterUserDTO, LoginUserDTO } from './auth.schemas';
import { Prisma } from '../../generated/prisma/client';
import argon2 from 'argon2';

const AuthService = {
    async registerUser(dto: RegisterUserDTO) {
        const existingEmail = await AuthRepository.findByEmail(dto.email);

        if (existingEmail) {
            return null;
        }

        const existingUsername = await AuthRepository.findByUsername(dto.username);

        if (existingUsername) {
            return null;
        }

        const hashedPassword = await argon2.hash(dto.password, {
            type: argon2.argon2id,
        });

        const data: Prisma.UserCreateInput = {
            username: dto.username,
            email: dto.email,
            password: hashedPassword,
        };

        const createdUser = await AuthRepository.createUser(data);

        const { password, ...safeUser } = createdUser;

        return safeUser;
    },

    async loginUser(dto: LoginUserDTO) {
        const user = await AuthRepository.findByEmail(dto.email);

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
        const user = await AuthRepository.findById(userId);

        if (!user) {
            return null;
        }

        const { password, ...safeUser } = user;

        return safeUser;
    },
};

export default AuthService;