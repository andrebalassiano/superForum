// Canonical test users. Their `id`s are fixed UUIDs so a test can seed a Profile with
// the same id the mocked token resolves to. Two users let us exercise the ownership
// paths (Alice creates, Bob is forbidden). Plain data only — the Supabase mock that
// consumes this lives in test/setup/each-setup.ts.

export interface TestUser {
    id: string;
    email: string;
    token: string;
}

// The ids are valid v4 UUIDs (version nibble 4, variant nibble 8) so they pass Zod's
// z.uuid() version/variant check on routes that validate a user id in the URL
// (e.g. GET /auth/profiles/:id).
export const TEST_USERS = {
    alice: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'alice@test.dev',
        token: 'test-token-alice',
    },
    bob: {
        id: '22222222-2222-4222-8222-222222222222',
        email: 'bob@test.dev',
        token: 'test-token-bob',
    },
} as const satisfies Record<string, TestUser>;

// The mocked supabase.auth.getUser looks the bearer token up here.
export const TOKEN_TO_USER: Record<string, TestUser> = Object.fromEntries(
    Object.values(TEST_USERS).map((u) => [u.token, u]),
);

// Convenience for supertest: .set('Authorization', authHeader(TEST_USERS.alice))
export function authHeader(user: TestUser): string {
    return `Bearer ${user.token}`;
}
