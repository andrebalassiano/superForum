import { Request, Response } from 'express';
import commentsService from './comments.service';
import { CreateCommentDTO, IdParamsDTO, UpdateCommentDTO } from './comments.schemas';


const commentsController = {

    async createComment(req: Request<object, object, CreateCommentDTO>, res: Response) {

        // defensive check — requireAuth should guarantee req.user, but TS doesn't know that
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        try {
            const dto = req.body;

            // authorId comes from the verified token, not the client — prevents impersonation
            const comment = await commentsService.createComment(req.user.id, dto);

            // service returns null when the referenced post doesn't exist (P2025) — map to 404
            if (!comment) {
                return res.status(404).json({ message: 'Post not found' });
            }

            return res.status(201).json(comment);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to create comment' });
        }
    },

    async getCommentById(req: Request<IdParamsDTO>, res: Response) {
        const { id } = req.params;

        try {
            // req.user is undefined for anonymous callers (optionalAuth didn't reject) — pass through
            const comment = await commentsService.getCommentById(id, req.user?.id);

            if (!comment) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            return res.status(200).json(comment);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to fetch comment' });
        }
    },

    // expects the route to expose `postId` as a URL param (e.g. /comments/by-post/:postId)
    // — kept generic here so the router decides the URL shape
    async getCommentsByPostId(req: Request<{ postId: string }>, res: Response) {
        const { postId } = req.params;

        try {
            const comments = await commentsService.getCommentsByPostId(postId, req.user?.id);

            // empty list is a valid result (post simply has no comments yet) — don't 404
            return res.status(200).json(comments);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to fetch comments' });
        }
    },

    async updateComment(req: Request<IdParamsDTO, object, UpdateCommentDTO>, res: Response) {
        const { id } = req.params;

        try {
            const comment = await commentsService.updateComment(id, req.body);

            // service returns null on the P2025 path (no row with that id) — map to 404
            if (!comment) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            return res.status(200).json(comment);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to update comment' });
        }
    },

    async deleteComment(req: Request<IdParamsDTO>, res: Response) {
        const { id } = req.params;

        try {
            const comment = await commentsService.deleteComment(id);

            if (!comment) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            // 204 No Content is the REST standard for a successful delete — nothing to send back
            return res.sendStatus(204);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to delete comment' });
        }
    },
};


export default commentsController;
