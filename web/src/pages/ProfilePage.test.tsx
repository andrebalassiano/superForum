import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { renderWithProviders } from '../test/renderWithProviders';
import ProfilePage from './ProfilePage';
import { apiFetch } from '../api';

// A plain factory, deliberately not one that pulls in the real module. Reaching for the real `../api`
// executes it, and it imports the Supabase client, which throws at import time when
// VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are unset. That passes on a machine with a
// web/.env.local and fails in CI, which has no secrets on purpose. Nothing here needs the real
// module: ProfilePage only reads `error.message`, so a plain Error carries what the error branch
// asserts on. (api.test.ts, which does test the real module, mocks ../lib/supabase instead.)
vi.mock('../api', () => ({ apiFetch: vi.fn(), API_URL: '', PAGE_SIZE: 5 }));
const mockedFetch = vi.mocked(apiFetch);

const PROFILE = {
    id: 'user-1',
    username: 'alice',
    createdAt: '2026-03-15T00:00:00.000Z',
    _count: { posts: 1, comments: 1 },
    reputation: { posts: 8, comments: 2, total: 10 },
};

const POST = {
    id: 'post-1',
    title: 'Something alice wrote',
    content: 'Body',
    score: 8,
    createdAt: new Date().toISOString(),
    authorId: 'user-1',
    author: { username: 'alice' },
    community: { id: 'community-1', name: 'general' },
    _count: { comments: 0 },
    currentUserVote: null,
};

const COMMENT = {
    id: 'comment-1',
    content: 'Something alice replied',
    score: 2,
    createdAt: new Date().toISOString(),
    authorId: 'user-1',
    author: { username: 'alice' },
    currentUserVote: null,
    post: { id: 'post-9', title: 'Another thread' },
};

// The page fires three requests against three URLs; route the mock on the path so each query gets
// the shape it expects rather than one catch-all response.
function routeByPath(overrides: { profile?: unknown } = {}) {
    mockedFetch.mockImplementation((path: string) => {
        if (path.includes('/comments')) {
            return Promise.resolve({ items: [COMMENT], nextCursor: null });
        }
        if (path.includes('/posts')) {
            return Promise.resolve({ items: [POST], nextCursor: null });
        }
        return Promise.resolve(overrides.profile ?? PROFILE);
    });
}

function renderAt(url = '/u/alice') {
    return renderWithProviders(
        <Routes>
            <Route path="/u/:username" element={<ProfilePage />} />
        </Routes>,
        { initialEntries: [url] },
    );
}

beforeEach(() => {
    mockedFetch.mockReset();
});

describe('ProfilePage', () => {
    it('shows the username, reputation total and join month', async () => {
        routeByPath();
        renderAt();

        // Awaiting the heading would prove nothing: it falls back to the username from the URL,
        // which is the same string, so it renders before the request resolves. The reputation total
        // only exists once the profile has loaded.
        expect(await screen.findByText('10')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'alice' })).toBeInTheDocument();
        expect(screen.getByText(/joined March 2026/)).toBeInTheDocument();
    });

    it('opens on the posts tab', async () => {
        routeByPath();
        renderAt();

        expect(
            await screen.findByRole('link', { name: 'Something alice wrote' }),
        ).toBeInTheDocument();
        expect(screen.queryByText('Something alice replied')).not.toBeInTheDocument();
    });

    // The comments query is disabled until its tab is active, so this also proves the request is
    // deferred rather than fired on mount.
    it('loads comments only once the comments tab is selected', async () => {
        routeByPath();
        renderAt();

        await screen.findByRole('link', { name: 'Something alice wrote' });
        expect(mockedFetch.mock.calls.some(([p]) => String(p).includes('/comments'))).toBe(false);

        await userEvent.click(screen.getByRole('button', { name: /Comments/ }));

        expect(await screen.findByText('Something alice replied')).toBeInTheDocument();
    });

    // Reading the tab from the URL is what makes a profile's comments tab linkable and refresh-proof.
    it('honours ?tab=comments from the URL', async () => {
        routeByPath();
        renderAt('/u/alice?tab=comments');

        expect(await screen.findByText('Something alice replied')).toBeInTheDocument();
        expect(screen.queryByText('Something alice wrote')).not.toBeInTheDocument();
    });

    it('reports an unknown profile as an error rather than an empty page', async () => {
        mockedFetch.mockRejectedValue(new Error('Profile not found'));
        renderAt('/u/nobody');

        await waitFor(() => expect(screen.getByText(/Could not load profile/)).toBeInTheDocument());
    });
});
