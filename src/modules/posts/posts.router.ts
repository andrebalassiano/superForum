import express from 'express';
import postsController from './posts.controller';

const postsRouter = express.Router();

postsRouter
    .route('/')
    .get(postsController.getPosts)
    .post(postsController.createPost);

postsRouter
    .route('/:id')
    .get(postsController.getPostById)
    .patch(postsController.updatePost)
    .delete(postsController.deletePost);

// postsRouter.put('/:id', postsController.replacePostById);
// a lot of APIs don't use .put at all -> only used to fully replace a post, not only specified fields, as .patch

export default postsRouter;