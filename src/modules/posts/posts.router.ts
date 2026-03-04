import express from 'express';
import postsController from './posts.controller';

const postsRouter = express.Router();

postsRouter.get('/', postsController.getPosts);
postsRouter.post('/', createPost);


export default postsRouter;
