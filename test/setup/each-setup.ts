// Runs before every test file. Two responsibilities:
//   1. Replace the Supabase client with a mock so requireAuth/optionalAuth resolve a
//      known test user from the bearer token — no network, no real JWTs. The async
//      factory imports the token→user map lazily, sidestepping vi.mock's hoisting rules.
//   2. Truncate all tables before each test so every test starts from an empty DB.
import { beforeEach, vi } from 'vitest';
import { truncateAll } from '../helpers/db';

vi.mock('../../src/core/supabaseClient', async () => {
    const { TOKEN_TO_USER } = await import('../helpers/auth');

    return {
        default: {
            auth: {
                async getUser(token: string) {
                    const user = TOKEN_TO_USER[token];

                    if (!user) {
                        return { data: { user: null }, error: { message: 'Invalid token' } };
                    }

                    return {
                        data: { user: { id: user.id, email: user.email } },
                        error: null,
                    };
                },
            },
        },
    };
});

beforeEach(async () => {
    await truncateAll();
});
