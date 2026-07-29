import z from 'zod';

// body for POST /posts/:postId/comments — a comment is a sub-resource of a post, so postId
// comes from the URL, not the body; authorId comes from req.user.id (set by requireAuth).
// Neither is accepted in the body, so a client can't impersonate a user or reassign a post.
// .strict() rejects unknown keys with a 400 (including a stray postId) instead of ignoring them.
export const createCommentBodySchema = z.object({
    content: z.string().trim().min(1),
    timestamp: z.iso.datetime(),
}).strict();

// body for PATCH /comments/:id — only `content` is editable; postId/authorId/timestamp are immutable
// (you don't reassign a comment to a different post or backdate it).
export const updateCommentSchema = z.object({
    content: z.string().trim().min(1).optional(),
}).strict();

// reusable schema for any route with a UUID in the URL (e.g. /:id)
export const idParamsSchema = z.object({
    id: z.uuid(),
});

// for the nested list route GET /posts/:postId/comments — :postId comes in as a string param
// and we validate it the same way we validate :id, just under a different name
export const postIdParamsSchema = z.object({
    postId: z.uuid(),
});

// DTOs inferred from the schemas — one source of truth for runtime validation and TS types
export type CreateCommentBodyDTO = z.infer<typeof createCommentBodySchema>;
export type UpdateCommentDTO = z.infer<typeof updateCommentSchema>;
export type IdParamsDTO = z.infer<typeof idParamsSchema>;
export type PostIdParamsDTO = z.infer<typeof postIdParamsSchema>;