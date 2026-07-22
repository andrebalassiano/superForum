import { Request, Response } from 'express';
import postsService from './posts.service';
import { CreatePostDTO, IdParamsDTO } from './posts.schemas';


const postsController = {

    async getPosts(req: Request, res: Response) {

        try {
            // req.user is undefined for anonymous callers (optionalAuth didn't reject) and populated
            // when a valid token was present — pass through with optional chaining
            const posts = await postsService.getAllPosts(req.user?.id);

            return res.status(200).json(posts);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to fetch posts'});
        }
    },

    async getPostById(req: Request<IdParamsDTO>, res: Response) {

        const { id } = req.params;

        try {
            const post = await postsService.getPostById(id, req.user?.id);

            if (!post) {
                return res.status(404).json({ message: 'Post not found'});
            }

            return res.status(200).json(post);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to fetch post'});
        }
    },

    async createPost(req: Request<object, object, CreatePostDTO>, res: Response) {

        // defensive check — requireAuth should guarantee req.user, but TS doesn't know that
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        try {
            const dto = req.body;

            // authorId comes from the verified token, not the client — prevents impersonation
            const post = await postsService.createPost(req.user.id, dto);

            return res.status(201).json(post);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to create post'});
        }
    },

    async updatePost(req: Request<IdParamsDTO>, res: Response) {

        const { id } = req.params;

        try {
            const dto = req.body;

            const post = await postsService.updatePost(id, dto);

            if (!post) {
                return res.status(404).json({ message: 'Post not found'});
            }

            return res.status(200).json(post);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to update post'});
        }
    },

    async deletePost(req: Request<IdParamsDTO>, res: Response) {
        
        const { id } = req.params;

        try {
            const post = await postsService.deletePost(id);

            if (!post) {
                return res.status(404).json({ message: 'Post not found'});
            }

            return res.sendStatus(204);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to delete post'});
        }
    }
}


export default postsController;