import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../api';
import type { Profile } from '../types';
import { AuthContext, type AuthContextValue } from './AuthContext';

// Wraps the app (in main.tsx). It owns the session state and keeps it in sync with Supabase.
export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        // On mount, ask Supabase for any persisted session (it survives reloads via localStorage),
        // then subscribe to every future change — sign-in, sign-out, and automatic token refresh.
        void supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
            setSession(newSession);

            // When the identity actually changes, the cached queries were fetched under the old
            // token — invalidate them so they refetch and personalized fields (currentUserVote)
            // reflect who's now signed in (or out). We skip TOKEN_REFRESHED / INITIAL_SESSION,
            // which don't change who the user is.
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                void queryClient.invalidateQueries();
            }
        });

        // Unsubscribe when the provider unmounts, so we don't leak the listener.
        return () => sub.subscription.unsubscribe();
    }, [queryClient]);

    // Each action throws on failure so the caller (the login form) can surface the message.
    async function signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    }

    // Two steps, because the Supabase identity and the app's Profile are separate records: sign up,
    // then create the Profile the new session is authorized to create. Without the second step the
    // account can read the forum but every write fails with "Profile not found" — which is exactly
    // what happened to accounts made before this existed.
    async function signUp(email: string, password: string, username: string) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // No session means the project requires email confirmation, so we can't authenticate the
        // profile call yet. Not an error — the banner in App picks these users up after they
        // confirm and sign in.
        if (!data.session) return;

        await apiFetch<Profile>('/auth/profile', { method: 'POST', body: { username } });
        // The profile query may already have run (and 404'd) during the sign-up round trip.
        void queryClient.invalidateQueries({ queryKey: ['profile'] });
    }

    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    const value: AuthContextValue = {
        session,
        user: session?.user ?? null,
        loading,
        signIn,
        signUp,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
