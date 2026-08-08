import express from 'express';
import postsController from './posts.controller';
import requireAuth from '../../middleware/requireAuth';
import optionalAuth from '../../middleware/optionalAuth';
import validateBody from '../../middleware/validateBody';
import validateParams from '../../middleware/validateParams';
import validateQuery from '../../middleware/validateQuery';
import {
    createPostSchema,
    updatePostSchema,
    idParamsSchema,
    postListQuerySchema,
} from './posts.schemas';

const postsRouter = express.Router();

// GETs use optionalAuth: anonymous browsing still works (req.user undefined), and when a valid
// token IS present the controller can personalize the response (e.g. currentUserVote on each post).
// POST requires hard auth so the server can attribute the new post to req.user.id; validateBody runs
// the (strict) createPostSchema so unknown/invalid fields are rejected with a 400 at the boundary.
postsRouter
    .route('/')
    .get(optionalAuth, validateQuery(postListQuerySchema), postsController.getPosts)
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

// No PUT /:id on purpose: PUT means "replace the whole resource", but the only editable fields are
// title/content (author and community are fixed), so PATCH — partial update of just what's sent — is
// the honest verb. A full-replace route would buy nothing here.

// Nested list route, mounted at /communities/:id/posts in the main router. mergeParams: true lets
// this inner router see :id from the outer mount path (otherwise req.params.id would be undefined).
// Reuses postListQuerySchema so the community feed supports the same ?limit/?cursor/?sort as GET /posts.
const communityPostsRouter = express.Router({ mergeParams: true });

communityPostsRouter
    .route('/')
    .get(
        optionalAuth,
        validateParams(idParamsSchema),
        validateQuery(postListQuerySchema),
        postsController.getPostsByCommunity,
    );

export default postsRouter;
export { communityPostsRouter };
