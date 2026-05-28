import z from 'zod';

// body for POST /comments — authorId is intentionally NOT here; it comes from req.user.id
// (set by requireAuth) so a client can't impersonate another user.
// postId IS in the body for now; it could also live in the URL (e.g. POST /posts/:postId/comments)
// but keeping it flat matches the current posts module shape.
export const createCommentSchema = z.object({
    content: z.string().trim().min(1),
    timestamp: z.iso.datetime(),
    postId: z.uuid(),
});

// body for PATCH /comments/:id — only `content` is editable; postId/authorId/timestamp are immutable
// (you don't reassign a comment to a different post or backdate it).
export const updateCommentSchema = z.object({
    content: z.string().trim().min(1).optional(),
});

// reusable schema for any route with a UUID in the URL (e.g. /:id)
export const idParamsSchema = z.object({
    id: z.uuid(),
});

// DTOs inferred from the schemas — one source of truth for runtime validation and TS types
export type CreateCommentDTO = z.infer<typeof createCommentSchema>;
export type UpdateCommentDTO = z.infer<typeof updateCommentSchema>;
export type IdParamsDTO = z.infer<typeof idParamsSchema>;
