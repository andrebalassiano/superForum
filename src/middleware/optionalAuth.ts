import { NextFunction, Request, Response } from 'express';
import supabase from '../core/supabaseClient';


// Soft sibling to requireAuth: populates req.user when a valid token is present, but never rejects.
// Use this on GET routes that are public but want to personalize the response when the caller is
// known (e.g. fold "your current vote" into the post feed). Anonymous callers fall through with
// req.user still undefined — the controller decides what to do in that case.
async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    // no token at all → anonymous; just continue without setting req.user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    const { data, error } = await supabase.auth.getUser(token);

    // bad/expired token → treat as anonymous rather than 401, so a stale token doesn't break
    // the public-feed UX for a user whose session just lapsed
    if (error || !data.user) {
        return next();
    }

    req.user = {
        id: data.user.id,
        email: data.user.email ?? null,
    };

    return next();
}

export default optionalAuth;
