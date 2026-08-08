import { Request, Response } from 'express';
import authService from './auth.service';
import { CreateProfileDTO, IdParamsDTO } from './auth.schemas';

const authController = {
    async createProfile(req: Request<object, object, CreateProfileDTO>, res: Response) {
        try {
            const dto = req.body;

            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const profile = await authService.createProfile(req.user.id, dto.username);

            if (!profile) {
                return res.status(409).json({ message: 'Username already in use' });
            }

            return res.status(201).json(profile);
        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to create profile' });
        }
    },

    async getProfileById(req: Request<IdParamsDTO>, res: Response) {
        const { id } = req.params;

        try {
            const profile = await authService.getProfileById(id);

            if (!profile) {
                return res.status(404).json({ message: 'Profile not found' });
            }

            return res.status(200).json(profile);
        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to fetch profile' });
        }
    },

    async getCurrentProfile(req: Request, res: Response) {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        try {
            const profile = await authService.getProfileById(req.user.id);

            if (!profile) {
                return res.status(404).json({ message: 'Profile not found' });
            }

            return res.status(200).json(profile);
        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to fetch current profile' });
        }
    },
};

export default authController;
