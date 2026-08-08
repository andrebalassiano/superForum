import express from 'express';
import votesController from './votes.controller';
import requireAuth from '../../middleware/requireAuth';
import validateBody from '../../middleware/validateBody';
import validateParams from '../../middleware/validateParams';
import { voteBodySchema, postIdParamsSchema, commentIdParamsSchema } from './votes.schemas';

// Mounted at /posts/:postId/vote in the main router.
// mergeParams: true lets this inner router see :postId from the outer mount path.
const postVotesRouter = express.Router({ mergeParams: true });

// PUT  = idempotent "set my vote to value" (upsert under the hood)
// DELETE = remove my vote on this post
// Both require auth; userId is pulled from req.user.id, never from the body.
postVotesRouter
    .route('/')
    .put(
        requireAuth,
        validateParams(postIdParamsSchema),
        validateBody(voteBodySchema),
        votesController.setPostVote,
    )
    .delete(requireAuth, validateParams(postIdParamsSchema), votesController.removePostVote);

// Mounted at /comments/:commentId/vote in the main router — mirror of postVotesRouter.
const commentVotesRouter = express.Router({ mergeParams: true });

commentVotesRouter
    .route('/')
    .put(
        requireAuth,
        validateParams(commentIdParamsSchema),
        validateBody(voteBodySchema),
        votesController.setCommentVote,
    )
    .delete(requireAuth, validateParams(commentIdParamsSchema), votesController.removeCommentVote);

// Both named exports: neither router is the module's "primary" — both are nested under a parent
// resource path, so picking one to be the default would be arbitrary. The import site uses
// `import { postVotesRouter, commentVotesRouter }` which reads symmetrically.
export { postVotesRouter, commentVotesRouter };
