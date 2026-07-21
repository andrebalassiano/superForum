import express from 'express';
import communitiesController from './communities.controller';
import requireAuth from '../../middleware/requireAuth';
import validateBody from '../../middleware/validateBody';
import validateParams from '../../middleware/validateParams';
import { createCommunitySchema, updateCommunitySchema, idParamsSchema } from './communities.schemas';

const communitiesRouter = express.Router();

// Create a community — auth required so we know who's making it, body validated against the create schema.
communitiesRouter
    .route('/')
    .post(requireAuth, validateBody(createCommunitySchema), communitiesController.createCommunity);

// Read / update / delete a single community by id; :id is validated as a UUID for every verb on this route.
communitiesRouter
    .route('/:id')
    .get(validateParams(idParamsSchema), communitiesController.getCommunityById)
    .patch(
        requireAuth,
        validateParams(idParamsSchema),
        validateBody(updateCommunitySchema),
        communitiesController.updateCommunity,
    )
    .delete(requireAuth, validateParams(idParamsSchema), communitiesController.deleteCommunity);

export default communitiesRouter;