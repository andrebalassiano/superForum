import express from 'express';
import authController from './auth.controller';
import requireAuth from '../../middleware/requireAuth';
import validateBody from '../../middleware/validateBody';
import { createProfileSchema } from './auth.schemas';

const authRouter = express.Router();

// Creates the current user's Profile row (Supabase UUID = Profile.id); requires auth + validated body.
authRouter
    .route('/profile')
    .post(requireAuth, validateBody(createProfileSchema), authController.createProfile);

// Returns the authenticated caller's own Profile, resolved from req.user.id set by requireAuth.
authRouter.route('/me').get(requireAuth, authController.getCurrentProfile);

export default authRouter;
