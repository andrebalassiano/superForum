import z from 'zod';


export const createProfileSchema = z.object({
    id: z.uuid(),
    username: z.string().trim().min(1), // not strict on formatting for now
});

export const idParamsSchema = z.object({
    id: z.uuid(),
});


export type CreateProfileDTO = z.infer<typeof createProfileSchema>;
export type IdParamsDTO = z.infer<typeof idParamsSchema>;