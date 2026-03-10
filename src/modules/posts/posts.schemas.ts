import z from 'zod';


export const createPostSchema = z.object({
    title: z.string().trim(),
    content: z.string().min(1),
    timestamp: z.bigint(),
    authorId: z.uuid(),
    subredditId: z.uuid(),
});


export const updatePostSchema = createPostSchema.partial();





export type CreatePostDTO = z.infer<typeof createPostSchema>;

export type UpdatePostDTO = z.infer<typeof updatePostSchema>;