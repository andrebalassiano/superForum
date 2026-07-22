import { Request, Response } from 'express';
import votesService, { PROFILE_NOT_FOUND } from './votes.service';
import {
    CommentIdParamsDTO,
    PostIdParamsDTO,
    VoteBodyDTO,
} from './votes.schemas';


const votesController = {

    // ----- post votes -----

    async setPostVote(req: Request<PostIdParamsDTO, object, VoteBodyDTO>, res: Response) {

        // defensive check — requireAuth should guarantee req.user, but TS doesn't know that
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { postId } = req.params;

        try {
            const vote = await votesService.setPostVote(req.user.id, postId, req.body);

            // caller authenticated but never created their Profile row — tell them precisely
            if (vote === PROFILE_NOT_FOUND) {
                return res.status(404).json({ message: 'Profile not found — create your profile first' });
            }

            // null = the post doesn't exist (P2025 on the connect path)
            if (!vote) {
                return res.status(404).json({ message: 'Post not found' });
            }

            return res.status(200).json(vote);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to set vote' });
        }
    },

    async removePostVote(req: Request<PostIdParamsDTO>, res: Response) {

        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { postId } = req.params;

        try {
            const vote = await votesService.removePostVote(req.user.id, postId);

            // null = no vote existed for this (post, user) pair — nothing to remove
            if (!vote) {
                return res.status(404).json({ message: 'Vote not found' });
            }

            // 204 No Content is the REST standard for a successful delete — nothing to send back
            return res.sendStatus(204);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to remove vote' });
        }
    },

    // ----- comment votes -----

    async setCommentVote(req: Request<CommentIdParamsDTO, object, VoteBodyDTO>, res: Response) {

        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { commentId } = req.params;

        try {
            const vote = await votesService.setCommentVote(req.user.id, commentId, req.body);

            // caller authenticated but never created their Profile row — tell them precisely
            if (vote === PROFILE_NOT_FOUND) {
                return res.status(404).json({ message: 'Profile not found — create your profile first' });
            }

            if (!vote) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            return res.status(200).json(vote);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to set vote' });
        }
    },

    async removeCommentVote(req: Request<CommentIdParamsDTO>, res: Response) {

        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { commentId } = req.params;

        try {
            const vote = await votesService.removeCommentVote(req.user.id, commentId);

            if (!vote) {
                return res.status(404).json({ message: 'Vote not found' });
            }

            return res.sendStatus(204);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to remove vote' });
        }
    },
};


export default votesController;