import z from 'zod';


export const createProfileSchema = z.object({
    username: z.string().trim().min(1),
}).strict();

export const idParamsSchema = z.object({
    id: z.uuid(),
});


export type CreateProfileDTO = z.infer<typeof createProfileSchema>;
export type IdParamsDTO = z.infer<typeof idParamsSchema>;