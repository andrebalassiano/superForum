import express from 'express';
import subredditsController from './subreddits.controller';
import requireAuth from '../../middleware/requireAuth';
import validateBody from '../../middleware/validateBody';
import validateParams from '../../middleware/validateParams';
import { createSubredditSchema, updateSubredditSchema, idParamsSchema } from './subreddits.schemas';

const subredditsRouter = express.Router();

// Create a subreddit — auth required so we know who's making it, body validated against the create schema.
subredditsRouter
    .route('/')
    .post(requireAuth, validateBody(createSubredditSchema), subredditsController.createSubreddit);

// Read / update / delete a single subreddit by id; :id is validated as a UUID for every verb on this route.
subredditsRouter
    .route('/:id')
    .get(validateParams(idParamsSchema), subredditsController.getSubredditById)
    .patch(
        requireAuth,
        validateParams(idParamsSchema),
        validateBody(updateSubredditSchema),
        subredditsController.updateSubreddit,
    )
    .delete(requireAuth, validateParams(idParamsSchema), subredditsController.deleteSubreddit);

export default subredditsRouter;
