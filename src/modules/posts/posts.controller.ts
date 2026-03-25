import { Request, Response } from 'express';
import postsService from './posts.service';
import { IdParams } from './posts.schemas';


const postsController = {

    async getPosts(_req: Request, res: Response) {

        try {
            const posts = await postsService.getAllPosts();  // 
            
            return res.status(200).json(posts);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to fetch posts'});
        }
    },

    async getPostById(req: Request<IdParams>, res: Response) {
        
        const { id } = req.params;

        try {
            const post = await postsService.getPostById(id);

            if (!post) {
                return res.status(404).json({ message: 'Post not found'});
            }

            return res.status(200).json(post);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to fetch post'});
        }
    },

    async createPost(req: Request, res: Response) {

        try {
            const dto = req.body;

            const post = await postsService.createPost(dto);

            return res.status(201).json(post);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to create post'});
        }
    },

    async updatePost(req: Request<IdParams>, res: Response) {

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

    async deletePost(req: Request<IdParams>, res: Response) {
        
        const { id } = req.params;

        try {
            const post = await postsService.deletePost(id);

            if (!post) {
                return res.status(404).json({ message: 'Post not found'});
            }

            return res.status(200).json({ message: 'Post deleted successfully'});
            // this later should be changed to .sendStatus(204);
            // on successful deletion, 204 confirms it, with no required message - as is typical in REST APIs
            // 200 with a message is easier for debugging at this stage, though
            // CHANGEFLAG

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to delete post'});
        }
    }
}


export default postsController;