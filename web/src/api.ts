import { supabase } from './lib/supabase';

// The base URL of the backend, in one place. Read from a Vite env var so dev and production point at
// different backends: locally it falls back to the dev server, and a deployed build sets
// VITE_API_URL to the live API. (Like every VITE_ var, this is baked into the bundle at build time
// and public — fine, since it's just a URL.)
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

// How many posts each feed page requests. Deliberately small so pagination is visible without
// needing hundreds of posts; a real feed would use something larger (the backend caps limit at 100).
export const PAGE_SIZE = 5;

// An Error that also carries the HTTP status, so a caller can treat one failure differently from
// another — GET /auth/me answering 404 means "signed in but no profile yet", which is a state the
// UI handles, not an error to show. Everything else still reads `.message` as before.
// (The status is declared and assigned separately rather than as a constructor parameter property,
// because the client compiles with `erasableSyntaxOnly` — every TS construct must vanish at build
// time, and a parameter property would emit an assignment.)
export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// One choke point for every API call — the frontend mirror of the backend's middleware layer. It
// attaches the signed-in user's JWT, sets the method/body for writes, checks the response, unwraps
// the backend's { error: { message } } envelope into a thrown Error, and returns parsed JSON.
export async function apiFetch<T>(
    path: string,
    options?: { method?: string; body?: unknown },
): Promise<T> {
    // Grab the current session's access token (the JWT). getSession reads the cached session and
    // refreshes the token if it's expired, so requests always carry a valid one — or none, when the
    // user is anonymous, which the backend's optionalAuth handles gracefully.
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options?.body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_URL}${path}`, {
        method: options?.method ?? 'GET',
        headers,
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
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
        throw new ApiError(message, res.status);
    }

    // 204 No Content (e.g. a successful DELETE vote) has no body to parse.
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}
