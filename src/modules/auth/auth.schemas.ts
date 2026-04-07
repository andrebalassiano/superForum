import z from 'zod';


export const registerUserSchema = z.object({
    username: z.string().trim().min(1), // not strict on formatting for now
    email: z.email().trim(),
    password: z.string().min(8),
});

export const loginUserSchema = z.object({
    email: z.email().trim(),
    password: z.string().min(1),
});

export const idParamsSchema = z.object({
    id: z.uuid(),
});


// export const refreshTokenSchema = z.object({
//     refreshToken: z.string().min(1),
// });
// Token-related schemas will be added when token flow is implemented

export type RegisterUserDTO = z.infer<typeof registerUserSchema>;
export type LoginUserDTO = z.infer<typeof loginUserSchema>;
export type IdParamsDTO = z.infer<typeof idParamsSchema>;
// export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;