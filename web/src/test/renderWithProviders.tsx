import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from '../auth/AuthContext';

// Most components in this app assume three things above them: a router (anything with a <Link>), a
// query client (anything that reads or writes server state), and the auth context. This helper
// supplies all three so a test can render a component the way the app does.

// Just enough of a Supabase User to satisfy the type — components only ever read `email`.
const FAKE_USER = { id: 'user-1', email: 'tester@example.com' } as User;

export function makeTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            // A test asserting an error state shouldn't wait through three silent retries.
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
}

export function renderWithProviders(
    ui: ReactElement,
    { signedIn = true, queryClient = makeTestQueryClient() } = {},
) {
    const auth: AuthContextValue = {
        session: null,
        user: signedIn ? FAKE_USER : null,
        loading: false,
        signIn: () => Promise.resolve(),
        signUp: () => Promise.resolve(),
        signOut: () => Promise.resolve(),
    };

    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                <AuthContext.Provider value={auth}>
                    <MemoryRouter>{children}</MemoryRouter>
                </AuthContext.Provider>
            </QueryClientProvider>
        );
    }

    // Returning the client lets a test seed or inspect the cache — which is how the optimistic
    // vote update is checked.
    return { ...render(ui, { wrapper: Wrapper }), queryClient };
}
