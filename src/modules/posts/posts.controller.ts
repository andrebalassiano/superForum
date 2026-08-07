import { Request, Response } from 'express';
import postsService, { FORBIDDEN, PROFILE_NOT_FOUND } from './posts.service';
import { CreatePostDTO, IdParamsDTO, UpdatePostDTO } from './posts.schemas';


const postsController = {

    async getPosts(req: Request, res: Response) {

        try {
            // req.user is undefined for anonymous callers (optionalAuth didn't reject) and populated
            // when a valid token was present — pass through with optional chaining. pagination is set
            // by validateQuery; the fallback only guards against the route being wired without it.
            const pagination = req.pagination ?? { limit: 20 };
            const posts = await postsService.getAllPosts(req.user?.id, pagination);

            return res.status(200).json(posts);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to fetch posts'});
        }
    },

    // GET /communities/:id/posts — the global feed scoped to one community. Same pipeline as
    // getPosts (optionalAuth → currentUserVote, cursor pagination, sort), just filtered by the
    // community id from the URL. An unknown/empty community yields an empty page, not a 404 —
    // consistent with the nested comments list.
    async getPostsByCommunity(req: Request<IdParamsDTO>, res: Response) {

        const { id } = req.params;

        try {
            const pagination = req.pagination ?? { limit: 20 };
            const posts = await postsService.getAllPosts(req.user?.id, pagination, id);

            return res.status(200).json(posts);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to fetch posts' });
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

            // caller authenticated but never created their Profile row — tell them precisely
            if (post === PROFILE_NOT_FOUND) {
                return res.status(404).json({ message: 'Profile not found — create your profile first' });
            }

            // service returns null when the referenced community doesn't exist (P2025) — map to 404
            if (!post) {
                return res.status(404).json({ message: 'Community not found' });
            }

            return res.status(201).json(post);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to create post'});
        }
    },

    async updatePost(req: Request<IdParamsDTO, object, UpdatePostDTO>, res: Response) {

        // defensive check — requireAuth should guarantee req.user, but TS doesn't know that
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;

        try {
            const dto = req.body;

            const post = await postsService.updatePost(id, req.user.id, dto);

            // caller isn't the author — 403 (distinct from 404 for a genuinely missing post)
            if (post === FORBIDDEN) {
                return res.status(403).json({ message: 'You can only modify your own posts' });
            }

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

        // defensive check — requireAuth should guarantee req.user, but TS doesn't know that
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;

        try {
            const post = await postsService.deletePost(id, req.user.id);

            if (post === FORBIDDEN) {
                return res.status(403).json({ message: 'You can only modify your own posts' });
            }

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