import z from 'zod';
import { paginationFields } from '../../core/pagination';


// Query for GET /posts — cursor pagination plus a feed sort: `new` (default, most recent first,
// by createdAt) or `top` (highest score first). The id tiebreak in the repo keeps either order total.
export const postListQuerySchema = z.object({
    ...paginationFields,
    sort: z.enum(['new', 'top']).default('new'),
}).strict();

export type PostListQueryDTO = z.infer<typeof postListQuerySchema>;


// authorId is intentionally NOT in the body — it's pulled from req.user.id (set by requireAuth)
// so a client can't impersonate another user by sending someone else's id.
// .strict() rejects unknown keys with a 400 instead of silently ignoring them.
export const createPostSchema = z.object({
    title: z.string().trim().min(1),
    content: z.string().min(1),
    communityId: z.uuid(),
}).strict();

export const idParamsSchema = z.object({
    id: z.uuid(),
});

// export const updatePostSchema = createPostSchema.partial();

export const updatePostSchema = z.object({
    title: z.string().trim().min(1).optional(),
    content: z.string().min(1).optional(),
}).strict();


export type CreatePostDTO = z.infer<typeof createPostSchema>;
export type UpdatePostDTO = z.infer<typeof updatePostSchema>;
export type IdParamsDTO = z.infer<typeof idParamsSchema>;