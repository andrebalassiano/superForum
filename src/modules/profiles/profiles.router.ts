import express from 'express';
import profilesController from './profiles.controller';
import validateParams from '../../middleware/validateParams';
import { usernameParamsSchema } from './profiles.schemas';

// Mounted at /profiles in the main router. This module owns the profile entity only — the two
// nested feeds (/profiles/:username/posts and /profiles/:username/comments) are owned by the posts
// and comments modules, the same way /communities/:id/posts is owned by posts.
const profilesRouter = express.Router();

profilesRouter
    .route('/:username')
    .get(validateParams(usernameParamsSchema), profilesController.getProfile);

export default profilesRouter;
