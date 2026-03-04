import express from 'express';
import postsController from './posts.controller';

const postsRouter = express.Router();

postsRouter.get('/', postsController.getPosts);
postsRouter.post('/', postsController.createPost);


export default postsRouter;
