import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, ApiError } from './api';
import { supabase } from './lib/supabase';

// The Supabase client is the only thing api.ts depends on, and it wants real credentials at import
// time — so it's mocked wholesale. `fetch` is stubbed per test to script the responses we care about.
vi.mock('./lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            refreshSession: vi.fn(),
            signOut: vi.fn(),
        },
    },
}));

const auth = vi.mocked(supabase.auth);

function session(token: string) {
    return { data: { session: { access_token: token } } };
}

const noSession = { data: { session: null } };

// Enough of a Response for apiFetch: ok, status, and json().
function respond(status: number, body?: unknown) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: () =>
            body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body),
    } as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    // @ts-expect-error — the mock returns only the slice of the session shape api.ts reads.
    auth.getSession.mockResolvedValue(session('good-token'));
});

describe('apiFetch', () => {
    it('sends the bearer token and returns the parsed body', async () => {
        fetchMock.mockResolvedValue(respond(200, { id: 'post-1' }));

        await expect(apiFetch('/posts/post-1')).resolves.toEqual({ id: 'post-1' });

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect((init.headers as Record<string, string>).Authorization).toBe('Bearer good-token');
    });

    it('unwraps the error envelope into the thrown message', async () => {
        fetchMock.mockResolvedValue(
            respond(409, { error: { message: 'Community name already in use' } }),
        );

        await expect(
            apiFetch('/communities', { method: 'POST', body: { name: 'x' } }),
        ).rejects.toThrow('Community name already in use');
    });

    // The recovery path: one stale token shouldn't cost the user their action.
    it('refreshes and replays the request once after a 401', async () => {
        fetchMock
            .mockResolvedValueOnce(respond(401, { error: { message: 'Invalid or expired token' } }))
            .mockResolvedValueOnce(respond(200, { ok: true }));
        // @ts-expect-error — partial session shape, as above.
        auth.refreshSession.mockResolvedValue(session('fresh-token'));

        await expect(apiFetch('/posts/post-1/vote', { method: 'PUT' })).resolves.toEqual({
            ok: true,
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        const [, retryInit] = fetchMock.mock.calls[1] as [string, RequestInit];
        expect((retryInit.headers as Record<string, string>).Authorization).toBe(
            'Bearer fresh-token',
        );
        expect(auth.signOut).not.toHaveBeenCalled();
    });

    // The session is genuinely gone: the app must stop pretending otherwise.
    it('signs out when the session cannot be refreshed', async () => {
        fetchMock.mockResolvedValue(
            respond(401, { error: { message: 'Invalid or expired token' } }),
        );
        // @ts-expect-error — partial session shape, as above.
        auth.refreshSession.mockResolvedValue(noSession);

        await expect(apiFetch('/posts/post-1/vote', { method: 'PUT' })).rejects.toThrow(
            /session has expired/i,
        );
        expect(auth.signOut).toHaveBeenCalledOnce();
    });

    it('signs out when the replayed request is rejected too', async () => {
        fetchMock.mockResolvedValue(
            respond(401, { error: { message: 'Invalid or expired token' } }),
        );
        // @ts-expect-error — partial session shape, as above.
        auth.refreshSession.mockResolvedValue(session('fresh-but-still-bad'));

        await expect(
            apiFetch('/posts/post-1', { method: 'PATCH', body: {} }),
        ).rejects.toBeInstanceOf(ApiError);
        // Original, retry — and no third attempt.
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(auth.signOut).toHaveBeenCalledOnce();
    });

    // An anonymous 401 says nothing about a session, because there wasn't one.
    it('does not try to refresh or sign out when there was no token', async () => {
        // @ts-expect-error — partial session shape, as above.
        auth.getSession.mockResolvedValue(noSession);
        fetchMock.mockResolvedValue(respond(401, { error: { message: 'Unauthorized' } }));

        await expect(apiFetch('/posts', { method: 'POST', body: {} })).rejects.toThrow(
            'Unauthorized',
        );
        expect(auth.refreshSession).not.toHaveBeenCalled();
        expect(auth.signOut).not.toHaveBeenCalled();
    });

    it('returns undefined for a 204', async () => {
        fetchMock.mockResolvedValue(respond(204));
        await expect(apiFetch('/posts/post-1/vote', { method: 'DELETE' })).resolves.toBeUndefined();
    });
});
