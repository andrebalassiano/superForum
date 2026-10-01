import { Request, Response } from 'express';
import profilesService from './profiles.service';
import { UsernameParamsDTO } from './profiles.schemas';

const profilesController = {
    // GET /profiles/:username — public, no auth. There is nothing to personalize on a profile
    // header, so this route takes neither requireAuth nor optionalAuth.
    async getProfile(req: Request<UsernameParamsDTO>, res: Response) {
        const { username } = req.params;

        try {
            const profile = await profilesService.getProfileByUsername(username);

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

export default profilesController;
