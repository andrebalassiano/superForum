import express from 'express';

import postsRouter from '../modules/posts/posts.router';
import authRouter from '../modules/auth/auth.router';
import commentsRouter, { postCommentsRouter } from '../modules/comments/comments.router';
import subredditsRouter from '../modules/subreddits/subreddits.router';
import { postVotesRouter, commentVotesRouter } from '../modules/votes/votes.router';

const router = express.Router();

router.use('/posts', postsRouter);
router.use('/auth', authRouter);
router.use('/comments', commentsRouter);
// nested vote route — exposes PUT/DELETE /comments/:commentId/vote via the votes module
router.use('/comments/:commentId/vote', commentVotesRouter);
// nested list route — exposes GET /posts/:postId/comments via the same module
router.use('/posts/:postId/comments', postCommentsRouter);
// nested vote route — exposes PUT/DELETE /posts/:postId/vote via the votes module
router.use('/posts/:postId/vote', postVotesRouter);
router.use('/subreddits', subredditsRouter);



export default router;