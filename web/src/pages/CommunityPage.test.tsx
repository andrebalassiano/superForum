import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { renderWithProviders } from '../test/renderWithProviders';
import CommunityPage from './CommunityPage';
import { apiFetch } from '../api';

// Plain factory, never vi.importActual: reaching for the real module executes api.ts, which imports
// the Supabase client and throws at import time when the env vars are unset — fine locally, fatal in
// CI, which has no secrets by design.
vi.mock('../api', () => ({ apiFetch: vi.fn(), API_URL: '', PAGE_SIZE: 5 }));
const mockedFetch = vi.mocked(apiFetch);

// renderWithProviders signs in as this id, so it decides whether the caller owns the community.
const ME = 'user-1';

function community(overrides: { ownerId?: string; posts?: number } = {}) {
    return {
        id: 'community-1',
        name: 'webdev',
        ownerId: overrides.ownerId ?? ME,
        _count: { posts: overrides.posts ?? 0 },
    };
}

function routeByPath(entity: ReturnType<typeof community>) {
    mockedFetch.mockImplementation((path: string) => {
        if (path.includes('/posts')) {
            return Promise.resolve({ items: [], nextCursor: null });
        }
        return Promise.resolve(entity);
    });
}

function renderAt() {
    return renderWithProviders(
        <Routes>
            <Route path="/communities/:id" element={<CommunityPage />} />
        </Routes>,
        { initialEntries: ['/communities/community-1'] },
    );
}

beforeEach(() => {
    mockedFetch.mockReset();
});

describe('CommunityPage owner controls', () => {
    it('offers delete to the owner of an empty community', async () => {
        routeByPath(community());
        renderAt();

        expect(await screen.findByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    // The rule lives on the server (409). This only explains it, so the owner isn't offered an
    // action that would fail.
    it('explains rather than offering delete when the community has posts', async () => {
        routeByPath(community({ posts: 3 }));
        renderAt();

        expect(await screen.findByText(/Delete the 3 posts in here/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('offers nothing to a non-owner', async () => {
        routeByPath(community({ ownerId: 'someone-else' }));
        renderAt();

        await screen.findByRole('heading', { name: 'webdev' });
        expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    // Deleting is two deliberate clicks, and the request only fires on the second.
    it('confirms before sending the delete', async () => {
        routeByPath(community());
        renderAt();

        await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
        expect(mockedFetch).not.toHaveBeenCalledWith(
            '/communities/community-1',
            expect.objectContaining({ method: 'DELETE' }),
        );

        expect(screen.getByText('Delete this community?')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(mockedFetch).toHaveBeenCalledWith(
            '/communities/community-1',
            expect.objectContaining({ method: 'DELETE' }),
        );
    });

    // Communities are deliberately not editable: name is the only mutable field, and renaming would
    // change the topic out from under everyone who already posted there.
    it('never offers edit', async () => {
        routeByPath(community());
        renderAt();

        await screen.findByRole('button', { name: 'Delete' });
        expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    });
});
