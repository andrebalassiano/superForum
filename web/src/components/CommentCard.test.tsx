import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/renderWithProviders';
import CommentCard from './CommentCard';
import type { ProfileComment } from '../types';

vi.mock('../api', () => ({ apiFetch: vi.fn(), API_URL: '', PAGE_SIZE: 5 }));

const COMMENT: ProfileComment = {
    id: 'comment-1',
    content: 'I agree with this',
    score: 3,
    createdAt: new Date().toISOString(),
    authorId: 'user-1',
    author: { username: 'alice' },
    currentUserVote: null,
    post: { id: 'post-9', title: 'The original thread' },
};

describe('CommentCard', () => {
    it('renders the comment body and its score', () => {
        renderWithProviders(<CommentCard comment={COMMENT} />);

        expect(screen.getByText('I agree with this')).toBeInTheDocument();
        expect(screen.getByText(/3 points/)).toBeInTheDocument();
    });

    // The whole point of this component over the in-thread one: a comment read from a profile has to
    // say which thread it belongs to and get you there.
    it('links to the parent post using its title', () => {
        renderWithProviders(<CommentCard comment={COMMENT} />);

        const link = screen.getByRole('link', { name: 'The original thread' });
        expect(link).toHaveAttribute('href', '/posts/post-9');
    });

    // Read-only by design. Vote buttons here would mean a fourth list shape for the cache to patch,
    // and editing belongs in the thread where the replies are visible.
    it('offers no voting or editing controls', () => {
        renderWithProviders(<CommentCard comment={COMMENT} />);

        expect(screen.queryByRole('button', { name: 'Upvote' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });
});
