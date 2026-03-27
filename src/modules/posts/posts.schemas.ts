import z from 'zod';


export const createPostSchema = z.object({
    title: z.string().trim(),
    content: z.string().min(1),
    timestamp: z.bigint(),  // number()?
    authorId: z.uuid(),
    subredditId: z.uuid(),
});

export const idParamsSchema = z.object({
    id: z.uuid()
});

export const updatePostSchema = createPostSchema.partial();



// export type IdParams = {
//     id: string;
// };

//CHATGPT

export type CreatePostDTO = z.infer<typeof createPostSchema>;

export type UpdatePostDTO = z.infer<typeof updatePostSchema>;

export type IdParamsDTO = z.infer<typeof idParamsSchema>;