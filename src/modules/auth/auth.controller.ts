import { Request, Response } from 'express';
import authService from './auth.service';
import { RegisterUserDTO, LoginUserDTO,IdParamsDTO } from './auth.schemas';


const authController = {
    async registerUser(req: Request<object, object, RegisterUserDTO>, res: Response) {

        try {
            const dto = req.body;

            const user = await authService.registerUser(dto);

            if (!user) {
                return res.status(409).json({ message: 'Email or username already in use' });
            }

            return res.status(201).json(user);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to register user' });
        }
    },

    async loginUser(req: Request<object, object, LoginUserDTO>, res: Response) {

        try {
            const dto = req.body;

            const user = await authService.loginUser(dto);

            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            return res.status(200).json(user);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to log in user' });
        }
    },

    async getUserById(req: Request<IdParamsDTO>, res: Response) { // will be changed later to 'getCurrentUser' when token middleware is implemented

        const { id } = req.params;

        try {
            const user = await authService.getUserById(id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json(user);

        } catch (error) {
            console.error(error);

            return res.status(500).json({ message: 'Failed to fetch user' });
        }
    },

};

export default authController;