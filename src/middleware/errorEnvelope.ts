import { NextFunction, Request, Response } from 'express';


// Normalizes every error response into one consistent shape: `{ error: { message, details? } }`.
// Controllers and the other middlewares keep sending plain `{ message }` (or `{ message, errors }`
// for validation) — this wraps res.json once per request so the envelope lives in exactly ONE
// place. Only 4xx/5xx bodies that carry a `message` are reshaped; success responses pass through
// untouched, and 204s (which never call res.json) are unaffected.
function errorEnvelope(req: Request, res: Response, next: NextFunction) {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
        if (
            res.statusCode >= 400 &&
            body !== null &&
            typeof body === 'object' &&
            'message' in body
        ) {
            // validation middlewares attach `errors` (the Zod issues); surface it as `details`.
            const { message, errors } = body as { message: unknown; errors?: unknown };
            const error: { message: unknown; details?: unknown } = { message };
            if (errors !== undefined) {
                error.details = errors;
            }
            return originalJson({ error });
        }

        return originalJson(body);
    } as typeof res.json;

    return next();
}

export default errorEnvelope;
