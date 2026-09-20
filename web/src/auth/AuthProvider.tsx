import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
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

    async function signUp(email: string, password: string) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
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
