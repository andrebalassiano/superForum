import express from 'express';
import authController from './auth.controller';

const authRouter = express.Router();

authRouter
    .route('/profile')
    .post(authController.createProfile);

authRouter
    .route('/profiles/:id')
    .get(authController.getProfileById);

// later:
// authRouter.route('/me').get(requireAuth, authController.getCurrentProfile);

export default authRouter;