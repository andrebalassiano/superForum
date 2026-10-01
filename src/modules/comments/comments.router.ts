import express from 'express';
import commentsController from './comments.controller';
import requireAuth from '../../middleware/requireAuth';
import optionalAuth from '../../middleware/optionalAuth';
import validateBody from '../../middleware/validateBody';
import validateParams from '../../middleware/validateParams';
import validateQuery from '../../middleware/validateQuery';
import {
    createCommentBodySchema,
    updateCommentSchema,
    idParamsSchema,
    postIdParamsSchema,
} from './comments.schemas';
import { paginationQuerySchema } from '../../core/pagination';
import { usernameParamsSchema } from '../profiles/profiles.schemas';

// Single-comment routes (read / update / delete), mounted at /comments in the main router.
// Creation lives on the nested postCommentsRouter below, since a comment belongs to a post.
const commentsRouter = express.Router();

// Read uses optionalAuth so the controller can fold in currentUserVote when the caller is known;
// update/delete still require hard auth. :id is validated as a UUID for every verb on this route.
commentsRouter
    .route('/:id')
    .get(optionalAuth, validateParams(idParamsSchema), commentsController.getCommentById)
    .patch(
        requireAuth,
        validateParams(idParamsSchema),
        validateBody(updateCommentSchema),
        commentsController.updateComment,
    )
    .delete(requireAuth, validateParams(idParamsSchema), commentsController.deleteComment);

// Nested list route, mounted at /posts/:postId/comments in the main router.
// mergeParams: true lets this inner router see :postId from the outer mount path
// (otherwise req.params.postId would be undefined here).
const postCommentsRouter = express.Router({ mergeParams: true });

// GET  — list all comments on a post (public; optionalAuth folds in currentUserVote).
// POST — create a comment on the post; requires auth, postId taken from the URL, body validated.
// :postId is validated as a UUID for both verbs.
postCommentsRouter
    .route('/')
    .get(
        optionalAuth,
        validateParams(postIdParamsSchema),
        validateQuery(paginationQuerySchema),
        commentsController.getCommentsByPostId,
    )
    .post(
        requireAuth,
        validateParams(postIdParamsSchema),
        validateBody(createCommentBodySchema),
        commentsController.createCommentForPost,
    );

// Nested list route, mounted at /profiles/:username/comments in the main router. mergeParams so
// :username from the outer mount is visible here. Read-only: a comment is created in its thread, not
// from a profile page, so there is no POST on this router.
const profileCommentsRouter = express.Router({ mergeParams: true });

profileCommentsRouter
    .route('/')
    .get(
        optionalAuth,
        validateParams(usernameParamsSchema),
        validateQuery(paginationQuerySchema),
        commentsController.getCommentsByAuthor,
    );

export default commentsRouter;
export { postCommentsRouter, profileCommentsRouter };
