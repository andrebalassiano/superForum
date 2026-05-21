import { NextFunction, Request, Response } from 'express';
import z from 'zod';


function validateBody(schema: z.ZodType) {
    return function (req: Request, res: Response, next: NextFunction) {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: 'Invalid request body',
                errors: result.error.issues,
            });
        }

        req.body = result.data;

        return next();
    };
}

export default validateBody;