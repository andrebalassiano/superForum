import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Everything a component might need regarding auth. Sharing this through Context means we never have
// to thread `user` and the auth actions down through props on every component in the tree.
interface AuthContextValue {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

// The context object itself. `undefined` as the default lets useAuth() below detect "used outside a
// provider" and fail loudly instead of handing back a silently-wrong value.
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Wraps the app (in main.tsx). It owns the session state and keeps it in sync with Supabase.
export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // On mount, ask Supabase for any persisted session (it survives reloads via localStorage),
        // then subscribe to every future change — sign-in, sign-out, and automatic token refresh.
        void supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
        });

        // Unsubscribe when the provider unmounts, so we don't leak the listener.
        return () => sub.subscription.unsubscribe();
    }, []);

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

// A convenience hook: components call useAuth() instead of useContext(AuthContext), and the guard
// turns a missing provider into a clear error instead of a confusing null crash later.
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (ctx === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
