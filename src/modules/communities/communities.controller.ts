import { Request, Response } from 'express';
import communitiesService from './communities.service';
import { CreateCommunityDTO, IdParamsDTO, UpdateCommunityDTO } from './communities.schemas';

const communitiesController = {
    async createCommunity(req: Request<object, object, CreateCommunityDTO>, res: Response) {
        try {
            const community = await communitiesService.createCommunity(req.body);

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
        const { id } = req.params;

        try {
            const community = await communitiesService.updateCommunity(id, req.body);

            // service returns null on the P2025 path (no row with that id) — map to 404
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
        const { id } = req.params;

        try {
            const community = await communitiesService.deleteCommunity(id);

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