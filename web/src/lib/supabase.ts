import { createClient } from '@supabase/supabase-js';

// The browser-side Supabase client. It handles sign-in, stores the session (including the JWT) in
// localStorage, and refreshes the token automatically before it expires. We only ever hand it the
// PUBLIC publishable key — never a secret. This is the client half of the auth lifecycle; the
// backend's requireAuth middleware validates the tokens this issues.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Supabase is not configured: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are not set.',
    );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
