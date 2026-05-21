import { NextFunction, Request, Response } from 'express';
import supabase from '../core/supabaseClient';


async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = {
        id: data.user.id,
        email: data.user.email ?? null,
    };

    return next();
}

export default requireAuth;