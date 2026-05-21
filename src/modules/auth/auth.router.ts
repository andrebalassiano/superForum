import express from 'express';
import authController from './auth.controller';
import requireAuth from '../../middleware/requireAuth';
import validateBody from '../../middleware/validateBody';
import validateParams from '../../middleware/validateParams';
import { createProfileSchema, idParamsSchema } from './auth.schemas';


const authRouter = express.Router();

authRouter
    .route('/profile')
    .post(requireAuth, validateBody(createProfileSchema), authController.createProfile);

authRouter
    .route('/profiles/:id')
    .get(validateParams(idParamsSchema), authController.getProfileById);

authRouter
    .route('/me')
    .get(requireAuth, authController.getCurrentProfile);


export default authRouter;