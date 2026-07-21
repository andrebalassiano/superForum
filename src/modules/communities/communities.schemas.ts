import z from 'zod';

// body shape for POST /communities — trim strips whitespace, min(1) rejects empty strings
export const createCommunitySchema = z.object({
    name: z.string().trim().min(1),
});

// body shape for PATCH /communities/:id — all fields optional since PATCH only updates what's sent
export const updateCommunitySchema = z.object({
    name: z.string().trim().min(1).optional(),
});

// reusable schema for any route with a UUID in the URL (e.g. /:id)
export const idParamsSchema = z.object({
    id: z.uuid(),
});

// DTOs inferred straight from the schemas — one source of truth for both runtime validation and TS types
export type CreateCommunityDTO = z.infer<typeof createCommunitySchema>;
export type UpdateCommunityDTO = z.infer<typeof updateCommunitySchema>;
export type IdParamsDTO = z.infer<typeof idParamsSchema>;