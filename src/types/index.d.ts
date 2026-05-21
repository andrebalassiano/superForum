export {};

declare global {
    namespace Express {
        interface AuthenticatedUser {
            id: string;
            email: string | null;
        }

        interface Request {
            user?: AuthenticatedUser;
        }
    }
}