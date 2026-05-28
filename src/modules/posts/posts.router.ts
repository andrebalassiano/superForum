import express from 'express';
import postsController from './posts.controller';
import requireAuth from '../../middleware/requireAuth';

const postsRouter = express.Router();

// GET is public; POST requires auth so the server can attribute the post to req.user.id
postsRouter
    .route('/')
    .get(postsController.getPosts)
    .post(requireAuth, postsController.createPost);

// reads are public; mutations require auth (later: also check ownership in the service)
postsRouter
    .route('/:id')
    .get(postsController.getPostById)
    .patch(requireAuth, postsController.updatePost)
    .delete(requireAuth, postsController.deletePost);

// postsRouter.put('/:id', postsController.replacePostById);
// a lot of APIs don't use .put at all -> only used to fully replace a post, not only specified fields, as .patch

export default postsRouter;