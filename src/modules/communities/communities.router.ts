import express from 'express';
import communitiesController from './communities.controller';
import requireAuth from '../../middleware/requireAuth';
import validateBody from '../../middleware/validateBody';
import validateParams from '../../middleware/validateParams';
import validateQuery from '../../middleware/validateQuery';
import { createCommunitySchema, updateCommunitySchema, idParamsSchema } from './communities.schemas';
import { paginationQuerySchema } from '../../core/pagination';

const communitiesRouter = express.Router();

// GET is a public, cursor-paginated list; POST creates one (auth required so we know who's making it,
// body validated against the create schema).
communitiesRouter
    .route('/')
    .get(validateQuery(paginationQuerySchema), communitiesController.getCommunities)
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