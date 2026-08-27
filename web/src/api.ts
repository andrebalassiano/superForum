// The base URL of the backend, in one place. Still a literal for now; a later step moves it to a
// Vite env var (import.meta.env) so dev and production can point at different backends.
export const API_URL = 'http://localhost:3000/api';

// One choke point for every API call — the frontend mirror of the backend's middleware layer. It
// prefixes the base URL, checks the response, unwraps the backend's { error: { message } } envelope
// into a real thrown Error, and returns parsed JSON. TanStack Query's queryFns call this, and Query
// turns a thrown error into the query's `error` state.
export async function apiFetch<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`);

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
