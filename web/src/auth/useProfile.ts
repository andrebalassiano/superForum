import { useQuery } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../api';
import { useAuth } from './AuthContext';
import type { Profile } from '../types';

// Reads the signed-in user's Profile row (GET /auth/me).
//
// Supabase authentication and the app's Profile are two different things: signing up creates the
// auth identity, but the Profile — the row every post, comment, and vote points at — only exists
// once POST /auth/profile has run. So a 404 here is not a failure, it's the "signed up but hasn't
// picked a username yet" state, and we return null for it. Anything else still throws.
//
// `data` is therefore: undefined while loading or signed out, null when there's no profile yet, or
// the profile itself.
export function useProfile() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['profile', 'me'],
        // Don't ask at all while signed out — the request would just 401.
        enabled: !!user,
        // A 404 is an answer, not a flake worth retrying.
        retry: false,
        queryFn: async () => {
            try {
                return await apiFetch<Profile>('/auth/me');
            } catch (error) {
                if (error instanceof ApiError && error.status === 404) return null;
                throw error;
            }
        },
    });
}
