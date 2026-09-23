import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/renderWithProviders';
import PostCard from './PostCard';
import type { Post } from '../types';

// PostCard renders VoteButtons, which calls apiFetch when clicked. Nothing here clicks, but the
// module is mocked anyway so an accidental network call can't reach a real server from a test.
vi.mock('../api', () => ({ apiFetch: vi.fn(), API_URL: '', PAGE_SIZE: 5 }));

function makePost(overrides: Partial<Post> = {}): Post {
    return {
        id: 'post-1',
        title: 'A post about testing',
        content: 'Some body text.',
        score: 7,
        createdAt: new Date().toISOString(),
        authorId: 'user-1',
        author: { username: 'alice' },
        community: { id: 'community-1', name: 'general' },
        _count: { comments: 3 },
        currentUserVote: null,
        ...overrides,
    };
}

describe('PostCard', () => {
    it('shows the title, community, author, score, and comment count', () => {
        renderWithProviders(<PostCard post={makePost()} />);

        expect(screen.getByRole('heading', { name: 'A post about testing' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'general' })).toBeInTheDocument();
        expect(screen.getByText(/by alice/)).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    // The card is the feed's navigation surface: the title goes to the post, the community name to
    // the community. Getting these URLs wrong is a broken feed, so they're worth pinning.
    it('links the title to the post and the community name to the community', () => {
        renderWithProviders(<PostCard post={makePost()} />);

        expect(screen.getByRole('link', { name: 'A post about testing' })).toHaveAttribute(
            'href',
            '/posts/post-1',
        );
        expect(screen.getByRole('link', { name: 'general' })).toHaveAttribute(
            'href',
            '/communities/community-1',
        );
    });

    // aria-pressed is how the thumbs communicate vote state to assistive tech — the visual cue is a
    // filled icon, which a screen reader can't see.
    it('marks the thumb matching the current vote as pressed', () => {
        renderWithProviders(<PostCard post={makePost({ currentUserVote: 1 })} />);

        expect(screen.getByRole('button', { name: 'Upvote' })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        expect(screen.getByRole('button', { name: 'Downvote' })).toHaveAttribute(
            'aria-pressed',
            'false',
        );
    });

    it('disables voting when signed out', () => {
        renderWithProviders(<PostCard post={makePost()} />, { signedIn: false });

        expect(screen.getByRole('button', { name: 'Upvote' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Downvote' })).toBeDisabled();
    });
});
