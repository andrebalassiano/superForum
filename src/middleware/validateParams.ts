import { NextFunction, Request, Response } from 'express';
import z from 'zod';


function validateParams(schema: z.ZodType) {
    return function (req: Request, res: Response, next: NextFunction) {
        const result = schema.safeParse(req.params);

        if (!result.success) {
            return res.status(400).json({
                message: 'Invalid route parameters',
                errors: result.error.issues,
            });
        }

        req.params = result.data as typeof req.params;

        return next();
    };
}

export default validateParams;