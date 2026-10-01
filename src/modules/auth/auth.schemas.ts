import z from 'zod';

export const createProfileSchema = z
    .object({
        username: z.string().trim().min(1),
    })
    .strict();

export type CreateProfileDTO = z.infer<typeof createProfileSchema>;
