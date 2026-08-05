import { Request, Response } from 'express';
import communitiesService, { FORBIDDEN } from './communities.service';
import { CreateCommunityDTO, IdParamsDTO, UpdateCommunityDTO } from './communities.schemas';

const communitiesController = {
    async createCommunity(req: Request<object, object, CreateCommunityDTO>, res: Response) {

        // defensive check — requireAuth should guarantee req.user, but TS doesn't know that
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        try {
            // ownerId comes from the verified token, not the client
            const community = await communitiesService.createCommunity(req.user.id, req.body);

            // service returns null when the name is already taken — translate that into a 409 Conflict
            if (!community) {
                return res.status(409).json({ message: 'Community name already in use' });
            }

            return res.status(201).json(community);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to create community' });
        }
    },

    async getCommunities(req: Request, res: Response) {
        try {
            const pagination = req.pagination ?? { limit: 20 };
            const communities = await communitiesService.getAllCommunities(pagination);

            return res.status(200).json(communities);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to fetch communities' });
        }
    },

    async getCommunityById(req: Request<IdParamsDTO>, res: Response) {
        const { id } = req.params;

        try {
            const community = await communitiesService.getCommunityById(id);

            if (!community) {
                return res.status(404).json({ message: 'Community not found' });
            }

            return res.status(200).json(community);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to fetch community' });
        }
    },

    async updateCommunity(req: Request<IdParamsDTO, object, UpdateCommunityDTO>, res: Response) {

        // defensive check — requireAuth should guarantee req.user, but TS doesn't know that
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;

        try {
            const community = await communitiesService.updateCommunity(id, req.user.id, req.body);

            // caller isn't the owner — 403 (distinct from 404 for a genuinely missing community)
            if (community === FORBIDDEN) {
                return res.status(403).json({ message: 'You can only modify your own communities' });
            }

            if (!community) {
                return res.status(404).json({ message: 'Community not found' });
            }

            return res.status(200).json(community);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to update community' });
        }
    },

    async deleteCommunity(req: Request<IdParamsDTO>, res: Response) {

        // defensive check — requireAuth should guarantee req.user, but TS doesn't know that
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { id } = req.params;

        try {
            const community = await communitiesService.deleteCommunity(id, req.user.id);

            if (community === FORBIDDEN) {
                return res.status(403).json({ message: 'You can only modify your own communities' });
            }

            if (!community) {
                return res.status(404).json({ message: 'Community not found' });
            }

            return res.sendStatus(204);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Failed to delete community' });
        }
    },
};

export default communitiesController;