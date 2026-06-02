import express from 'express';
import commentsController from './comments.controller';
import requireAuth from '../../middleware/requireAuth';
import optionalAuth from '../../middleware/optionalAuth';
import validateBody from '../../middleware/validateBody';
import validateParams from '../../middleware/validateParams';
import {
    createCommentSchema,
    updateCommentSchema,
    idParamsSchema,
    postIdParamsSchema,
} from './comments.schemas';


// CRUD on a single comment, mounted at /comments in the main router
const commentsRouter = express.Router();

// Create a comment — auth required so authorId can be pulled from req.user.id, body validated
commentsRouter
    .route('/')
    .post(requireAuth, validateBody(createCommentSchema), commentsController.createComment);

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

// List all comments on a given post — public read with optionalAuth for currentUserVote enrichment.
// :postId in the URL is validated as a UUID.
postCommentsRouter
    .route('/')
    .get(optionalAuth, validateParams(postIdParamsSchema), commentsController.getCommentsByPostId);


export default commentsRouter;
export { postCommentsRouter };