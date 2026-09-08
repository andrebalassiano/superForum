import { supabase } from './lib/supabase';

// The base URL of the backend, in one place. Still a literal for now; a later step moves it to a
// Vite env var (import.meta.env) so dev and production can point at different backends.
export const API_URL = 'http://localhost:3000/api';

// How many posts each feed page requests. Deliberately small so "Load more" is visible without
// needing hundreds of posts; a real feed would use something larger (the backend caps limit at 100).
export const PAGE_SIZE = 5;

// One choke point for every API call — the frontend mirror of the backend's middleware layer. It
// attaches the signed-in user's JWT, prefixes the base URL, checks the response, unwraps the
// backend's { error: { message } } envelope into a thrown Error, and returns parsed JSON.
export async function apiFetch<T>(path: string): Promise<T> {
    // Grab the current session's access token (the JWT). getSession reads the cached session and
    // refreshes the token if it's expired, so requests always carry a valid one — or none, when the
    // user is anonymous, which the backend's optionalAuth handles gracefully.
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const res = await fetch(`${API_URL}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
        // Prefer the backend's own message (that consistent error envelope paying off); fall back
        // to the HTTP status if the body isn't the shape we expect.
        let message = `Request failed (${res.status})`;
        try {
            const body = (await res.json()) as { error?: { message?: string } };
            if (body.error?.message) message = body.error.message;
        } catch {
            // error response had no JSON body — keep the status message
        }
        throw new Error(message);
    }

    return res.json() as Promise<T>;
}
