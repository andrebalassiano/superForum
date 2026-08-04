export {};

declare global {
    namespace Express {
        interface AuthenticatedUser {
            id: string;
            email: string | null;
        }

        interface Request {
            user?: AuthenticatedUser;
            // Set by the validateQuery middleware on cursor-paginated list routes.
            pagination?: { limit: number; cursor?: string };
        }
    }
}