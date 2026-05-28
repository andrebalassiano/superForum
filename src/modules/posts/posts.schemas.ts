import z from 'zod';


// authorId is intentionally NOT in the body — it's pulled from req.user.id (set by requireAuth)
// so a client can't impersonate another user by sending someone else's id.
export const createPostSchema = z.object({
    title: z.string().trim(),
    content: z.string().min(1),
    timestamp: z.iso.datetime(),
    subredditId: z.uuid(),
});

export const idParamsSchema = z.object({
    id: z.uuid(),
});

// export const updatePostSchema = createPostSchema.partial();

export const updatePostSchema = z.object({
    title: z.string().trim().optional(),
    content: z.string().min(1).optional(),
});


export type CreatePostDTO = z.infer<typeof createPostSchema>;
export type UpdatePostDTO = z.infer<typeof updatePostSchema>;
export type IdParamsDTO = z.infer<typeof idParamsSchema>;