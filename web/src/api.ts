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

interface RequestOptions {
    method?: string;
    body?: unknown;
}

function buildRequest(token: string | undefined, options?: RequestOptions): RequestInit {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options?.body !== undefined) headers['Content-Type'] = 'application/json';

    return {
        method: options?.method ?? 'GET',
        headers,
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    };
}

async function readError(res: Response): Promise<ApiError> {
    // Prefer the backend's own message (that consistent error envelope paying off); fall back
    // to the HTTP status if the body isn't the shape we expect.
    let message = `Request failed (${res.status})`;
    try {
        const body = (await res.json()) as { error?: { message?: string } };
        if (body.error?.message) message = body.error.message;
    } catch {
        // error response had no JSON body — keep the status message
    }
    return new ApiError(message, res.status);
}

async function parse<T>(res: Response): Promise<T> {
    // 204 No Content (e.g. a successful DELETE vote) has no body to parse.
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}

// One choke point for every API call — the frontend mirror of the backend's middleware layer. It
// attaches the signed-in user's JWT, sets the method/body for writes, checks the response, unwraps
// the backend's { error: { message } } envelope into a thrown Error, and returns parsed JSON.
export async function apiFetch<T>(path: string, options?: RequestOptions): Promise<T> {
    // Grab the current session's access token (the JWT). getSession reads the cached session and
    // refreshes the token if it's expired, so requests always carry a valid one — or none, when the
    // user is anonymous, which the backend's optionalAuth handles gracefully.
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const res = await fetch(`${API_URL}${path}`, buildRequest(token, options));
    if (res.ok) return parse<T>(res);

    // A 401 while we believed we were signed in means the stored session is no longer good — the
    // access token expired and wasn't refreshed in time, or the refresh token was rotated out from
    // under us (opening the app in several tabs can do that: they race to refresh, and Supabase
    // treats a reused refresh token as a stolen one and revokes the session).
    //
    // Left alone this is a bad state to be in: the client still holds a session object, so the UI
    // looks signed in and every write fails with a confusing message. So try once to get a fresh
    // token and replay the request; if that doesn't work, the session really is gone — sign out so
    // the app's state matches reality and the header offers a way back in.
    if (res.status === 401 && token) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        const newToken = refreshed.session?.access_token;

        if (newToken) {
            const retry = await fetch(`${API_URL}${path}`, buildRequest(newToken, options));
            if (retry.ok) return parse<T>(retry);
            if (retry.status !== 401) throw await readError(retry);
        }

        // signOut updates the Supabase client, which fires onAuthStateChange; AuthProvider clears
        // the session and drops every cached query, so the whole UI returns to a signed-out state.
        await supabase.auth.signOut();
        throw new ApiError('Your session has expired — please sign in again.', 401);
    }

    throw await readError(res);
}
