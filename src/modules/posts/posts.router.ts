import express from 'express';
import postsController from './posts.controller';
import requireAuth from '../../middleware/requireAuth';
import optionalAuth from '../../middleware/optionalAuth';
import validateBody from '../../middleware/validateBody';
import validateParams from '../../middleware/validateParams';
import { createPostSchema, updatePostSchema, idParamsSchema } from './posts.schemas';

const postsRouter = express.Router();

// GETs use optionalAuth: anonymous browsing still works (req.user undefined), and when a valid
// token IS present the controller can personalize the response (e.g. currentUserVote on each post).
// POST requires hard auth so the server can attribute the new post to req.user.id; validateBody runs
// the (strict) createPostSchema so unknown/invalid fields are rejected with a 400 at the boundary.
postsRouter
    .route('/')
    .get(optionalAuth, postsController.getPosts)
    .post(requireAuth, validateBody(createPostSchema), postsController.createPost);

// reads use optionalAuth for the same personalization reason; mutations require hard auth
// (later: also check ownership in the service). :id is validated as a UUID on every verb.
postsRouter
    .route('/:id')
    .get(optionalAuth, validateParams(idParamsSchema), postsController.getPostById)
    .patch(
        requireAuth,
        validateParams(idParamsSchema),
        validateBody(updatePostSchema),
        postsController.updatePost,
    )
    .delete(requireAuth, validateParams(idParamsSchema), postsController.deletePost);

// postsRouter.put('/:id', postsController.replacePostById);
// a lot of APIs don't use .put at all -> only used to fully replace a post, not only specified fields, as .patch

export default postsRouter;