import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { InfiniteData } from '@tanstack/react-query';
import { renderWithProviders, makeTestQueryClient } from '../test/renderWithProviders';
import VoteButtons from './VoteButtons';
import { apiFetch } from '../api';
import type { Page, Post } from '../types';

vi.mock('../api', () => ({ apiFetch: vi.fn(), API_URL: '', PAGE_SIZE: 5 }));
const mockedFetch = vi.mocked(apiFetch);

const POST: Post = {
    id: 'post-1',
    title: 'A post',
    content: 'Body',
    score: 5,
    createdAt: new Date().toISOString(),
    author: { username: 'alice' },
    community: { id: 'community-1', name: 'general' },
    _count: { comments: 0 },
    currentUserVote: null,
};

// The component takes the post as a prop but writes its optimistic update into the query cache —
// that's what makes one vote update the feed, the community feed, and the post page at once. So
// these tests seed both cache shapes and then assert on the cache, which is where the behaviour is.
function seedCaches(post: Post) {
    const queryClient = makeTestQueryClient();
    queryClient.setQueryData(['post', post.id], post);
    queryClient.setQueryData<InfiniteData<Page<Post>>>(['posts', 'new'], {
        pages: [{ items: [post], nextCursor: null }],
        pageParams: [''],
    });
    return queryClient;
}

function cachedPost(queryClient: ReturnType<typeof makeTestQueryClient>) {
    return queryClient.getQueryData<Post>(['post', POST.id]);
}

function cachedListPost(queryClient: ReturnType<typeof makeTestQueryClient>) {
    return queryClient.getQueryData<InfiniteData<Page<Post>>>(['posts', 'new'])?.pages[0].items[0];
}

beforeEach(() => {
    // A block body, not a one-liner: mockReset() returns the mock, and a hook's return value is
    // something Vitest waits on.
    mockedFetch.mockReset();
    mockedFetch.mockResolvedValue(undefined);
});

describe('VoteButtons', () => {
    it('applies an upvote to every cached copy of the post', async () => {
        const queryClient = seedCaches(POST);

        renderWithProviders(<VoteButtons post={POST} />, { queryClient });
        await userEvent.click(screen.getByRole('button', { name: 'Upvote' }));

        await waitFor(() => expect(cachedPost(queryClient)?.score).toBe(6));
        expect(cachedPost(queryClient)?.currentUserVote).toBe(1);
        expect(cachedListPost(queryClient)?.score).toBe(6);
        expect(cachedListPost(queryClient)?.currentUserVote).toBe(1);
    });

    // Switching sides is a two-point swing (+1 → -1 is a delta of -2), the easiest arithmetic here
    // to get wrong.
    it('swings the score by two when flipping an upvote to a downvote', async () => {
        const upvoted = { ...POST, score: 6, currentUserVote: 1 };
        const queryClient = seedCaches(upvoted);

        renderWithProviders(<VoteButtons post={upvoted} />, { queryClient });
        await userEvent.click(screen.getByRole('button', { name: 'Downvote' }));

        await waitFor(() => expect(cachedPost(queryClient)?.score).toBe(4));
        expect(cachedPost(queryClient)?.currentUserVote).toBe(-1);
    });

    it('clicking the active thumb removes the vote', async () => {
        const upvoted = { ...POST, score: 6, currentUserVote: 1 };
        const queryClient = seedCaches(upvoted);

        renderWithProviders(<VoteButtons post={upvoted} />, { queryClient });
        await userEvent.click(screen.getByRole('button', { name: 'Upvote' }));

        await waitFor(() => expect(cachedPost(queryClient)?.score).toBe(5));
        expect(cachedPost(queryClient)?.currentUserVote).toBeNull();
        expect(mockedFetch).toHaveBeenCalledWith(
            '/posts/post-1/vote',
            expect.objectContaining({ method: 'DELETE' }),
        );
    });

    // The other half of an optimistic update: if the server says no, the guess has to be taken back.
    it('rolls every cache back when the request fails', async () => {
        mockedFetch.mockRejectedValue(new Error('Network down'));
        const queryClient = seedCaches(POST);

        renderWithProviders(<VoteButtons post={POST} />, { queryClient });
        await userEvent.click(screen.getByRole('button', { name: 'Upvote' }));

        await waitFor(() => expect(cachedPost(queryClient)?.score).toBe(5));
        expect(cachedPost(queryClient)?.currentUserVote).toBeNull();
        expect(cachedListPost(queryClient)?.score).toBe(5);
    });

    it('does not send a request when signed out', async () => {
        const queryClient = seedCaches(POST);
        renderWithProviders(<VoteButtons post={POST} />, { queryClient, signedIn: false });

        // The button is disabled, so the click lands on nothing — pointer-events checking is what
        // userEvent does by default, hence the explicit opt-out to prove the disabled state holds.
        await userEvent.click(screen.getByRole('button', { name: 'Upvote' }), {
            pointerEventsCheck: 0,
        });

        expect(mockedFetch).not.toHaveBeenCalled();
        expect(cachedPost(queryClient)?.score).toBe(5);
    });
});
