import express from 'express';
import authController from './auth.controller';

const authRouter = express.Router();

authRouter
    .route('/register')
    .post(authController.registerUser);

authRouter
    .route('/login')
    .post(authController.loginUser);

authRouter
    .route('/users/:id')
    .get(authController.getUserById); // temporary. will be changed to getCurrentUser

// later:
// authRouter.route('/me').get(authController.getCurrentUser);
// authRouter.route('/refresh').post(authController.refreshToken);
// authRouter.route('/logout').post(authController.logoutUser);

export default authRouter;