import z from 'zod';

// body for PUT /posts/:postId/vote and PUT /comments/:commentId/vote.
// Only +1 (upvote) or -1 (downvote) are accepted — "no vote" is expressed by DELETE,
// not by sending value: 0, which keeps the DB free of zero-value rows.
// .strict() rejects unknown keys with a 400 instead of silently ignoring them.
export const voteBodySchema = z
    .object({
        value: z.union([z.literal(1), z.literal(-1)]),
    })
    .strict();

// for routes mounted under /posts/:postId/... — validates the URL param as a UUID
export const postIdParamsSchema = z.object({
    postId: z.uuid(),
});

// for routes mounted under /comments/:commentId/... — same idea, different key name
export const commentIdParamsSchema = z.object({
    commentId: z.uuid(),
});

// DTOs inferred from the schemas — one source of truth for runtime validation and TS types
export type VoteBodyDTO = z.infer<typeof voteBodySchema>;
export type PostIdParamsDTO = z.infer<typeof postIdParamsSchema>;
export type CommentIdParamsDTO = z.infer<typeof commentIdParamsSchema>;
