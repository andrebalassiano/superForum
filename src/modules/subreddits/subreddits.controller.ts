import { Request, Response } from 'express';
import subredditsService from './subreddits.service';
import { CreateSubredditDTO, IdParamsDTO, UpdateSubredditDTO } from './subreddits.schemas';

const subredditsController = {
    async createSubreddit(req: Request<object, object, CreateSubredditDTO>, res: Response) {
        try {
            const subreddit = await subredditsService.createSubreddit(req.body);

            // service returns null when the name is already taken — translate that into a 409 Conflict
            if (!subreddit) {
                return res.status(409).json({ message: 'Subreddit name already in use' });
            }

            return res.status(201).json(subreddit);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to create subreddit' });
        }
    },

    async getSubredditById(req: Request<IdParamsDTO>, res: Response) {
        const { id } = req.params;

        try {
            const subreddit = await subredditsService.getSubredditById(id);

            if (!subreddit) {
                return res.status(404).json({ message: 'Subreddit not found' });
            }

            return res.status(200).json(subreddit);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to fetch subreddit' });
        }
    },

    async updateSubreddit(req: Request<IdParamsDTO, object, UpdateSubredditDTO>, res: Response) {
        const { id } = req.params;

        try {
            const subreddit = await subredditsService.updateSubreddit(id, req.body);

            // service returns null on the P2025 path (no row with that id) — map to 404
            if (!subreddit) {
                return res.status(404).json({ message: 'Subreddit not found' });
            }

            return res.status(200).json(subreddit);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to update subreddit' });
        }
    },

    async deleteSubreddit(req: Request<IdParamsDTO>, res: Response) {
        const { id } = req.params;

        try {
            const subreddit = await subredditsService.deleteSubreddit(id);

            if (!subreddit) {
                return res.status(404).json({ message: 'Subreddit not found' });
            }

            // 204 No Content is the REST standard for a successful delete — nothing to send back
            return res.sendStatus(204);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to delete subreddit' });
        }
    },
};

export default subredditsController;
