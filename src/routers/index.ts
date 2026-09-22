import express from 'express';

import prisma from '../core/prismaSingleton';
import postsRouter, { communityPostsRouter } from '../modules/posts/posts.router';
import authRouter from '../modules/auth/auth.router';
import commentsRouter, { postCommentsRouter } from '../modules/comments/comments.router';
import communitiesRouter from '../modules/communities/communities.router';
import { postVotesRouter, commentVotesRouter } from '../modules/votes/votes.router';

const router = express.Router();

// Liveness + database check. Infrastructure, not a feature, so it lives here rather than in a
// module. Two jobs: a host's health probe, and the keep-warm cron (.github/workflows/keep-warm.yml)
// that pings it so Supabase's free tier never auto-pauses the database from inactivity — which is
// why it runs a real query instead of just returning 200.
router.get('/health', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error(error);
        return res.status(503).json({ message: 'Database unreachable' });
    }
});

router.use('/posts', postsRouter);
router.use('/auth', authRouter);
router.use('/comments', commentsRouter);
// nested vote route — exposes PUT/DELETE /comments/:commentId/vote via the votes module
router.use('/comments/:commentId/vote', commentVotesRouter);
// nested list route — exposes GET /posts/:postId/comments via the same module
router.use('/posts/:postId/comments', postCommentsRouter);
// nested vote route — exposes PUT/DELETE /posts/:postId/vote via the votes module
router.use('/posts/:postId/vote', postVotesRouter);
router.use('/communities', communitiesRouter);
// nested list route — exposes GET /communities/:id/posts via the posts module
router.use('/communities/:id/posts', communityPostsRouter);

export default router;
