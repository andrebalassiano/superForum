import express from 'express';
import postsRouter from '../modules/posts/posts.router';

const router = express.Router();

// wire from each module
router.use('/posts', postsRouter);



export default router;