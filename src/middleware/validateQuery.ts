import { NextFunction, Request, Response } from 'express';
import z from 'zod';


// Express 5 exposes req.query as a getter with no setter, so we can't overwrite it the way
// validateBody overwrites req.body. Instead we stash the parsed, typed result on req.pagination.
function validateQuery(schema: z.ZodType) {
    return function (req: Request, res: Response, next: NextFunction) {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            return res.status(400).json({
                message: 'Invalid query parameters',
                errors: result.error.issues,
            });
        }

        req.pagination = result.data as { limit: number; cursor?: string };

        return next();
    };
}

export default validateQuery;
