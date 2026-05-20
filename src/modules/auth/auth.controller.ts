import { Request, Response } from 'express';
import authService from './auth.service';
import { CreateProfileDTO, IdParamsDTO } from './auth.schemas';


const authController = {
    async createProfile(req: Request<object, object, CreateProfileDTO>, res: Response) {

        try {
            const dto = req.body;

            const profile = await authService.createProfile(dto.id, dto.username);

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
};

export default authController;