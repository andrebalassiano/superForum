import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

// Everything a component might need regarding auth. Sharing this through Context means we never have
// to thread `user` and the auth actions down through props on every component in the tree.
export interface AuthContextValue {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    // Takes a username because signing up is two steps: create the Supabase identity, then create
    // the app's own Profile row that posts and comments hang off.
    signUp: (email: string, password: string, username: string) => Promise<void>;
    signOut: () => Promise<void>;
}

// The context object itself. `undefined` as the default lets useAuth() below detect "used outside a
// provider" and fail loudly instead of handing back a silently-wrong value.
//
// This file holds only non-component exports (the context + the hook); the provider component
// lives in AuthProvider.tsx. Keeping them apart lets React Fast Refresh hot-swap component edits
// without a full reload.
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// A convenience hook: components call useAuth() instead of useContext(AuthContext), and the guard
// turns a missing provider into a clear error instead of a confusing null crash later.
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (ctx === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
