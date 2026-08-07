import express from 'express';

import postsRouter, { communityPostsRouter } from '../modules/posts/posts.router';
import authRouter from '../modules/auth/auth.router';
import commentsRouter, { postCommentsRouter } from '../modules/comments/comments.router';
import communitiesRouter from '../modules/communities/communities.router';
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
router.use('/communities', communitiesRouter);
// nested list route — exposes GET /communities/:id/posts via the posts module
router.use('/communities/:id/posts', communityPostsRouter);



export default router;