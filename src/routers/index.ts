import express from 'express';

import postsRouter from '../modules/posts/posts.router';
import authRouter from '../modules/auth/auth.router';
// import commentsRouter from '../modules/comments/comments.router';
import subredditsRouter from '../modules/subreddits/subreddits.router';
// import votesRouter from '../modules/votes/votes.router';

const router = express.Router();

router.use('/posts', postsRouter);
router.use('/auth', authRouter);
// router.use('/comments', commentsRouter);
router.use('/subreddits', subredditsRouter);
// router.use('/votes', votesRouter);



export default router;