import express from 'express';
import postsController from './posts.controller';
import requireAuth from '../../middleware/requireAuth';
import optionalAuth from '../../middleware/optionalAuth';

const postsRouter = express.Router();

// GETs use optionalAuth: anonymous browsing still works (req.user undefined), and when a valid
// token IS present the controller can personalize the response (e.g. currentUserVote on each post).
// POST requires hard auth so the server can attribute the new post to req.user.id.
postsRouter
    .route('/')
    .get(optionalAuth, postsController.getPosts)
    .post(requireAuth, postsController.createPost);

// reads use optionalAuth for the same personalization reason; mutations require hard auth
// (later: also check ownership in the service)
postsRouter
    .route('/:id')
    .get(optionalAuth, postsController.getPostById)
    .patch(requireAuth, postsController.updatePost)
    .delete(requireAuth, postsController.deletePost);

// postsRouter.put('/:id', postsController.replacePostById);
// a lot of APIs don't use .put at all -> only used to fully replace a post, not only specified fields, as .patch

export default postsRouter;