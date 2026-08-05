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
            // `sort` is only present on routes whose schema includes it (currently GET /posts).
            pagination?: { limit: number; cursor?: string; sort?: 'new' | 'top' };
        }
    }
}