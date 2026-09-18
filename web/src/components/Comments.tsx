import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, PAGE_SIZE } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import type { Comment, Page } from '../types';

interface CommentsProps {
    postId: string;
}

// The comment thread for one post: a paginated list (same infinite-scroll pattern as the feeds) plus
// a form to add a comment (a create mutation that refetches the list on success).
function Comments({ postId }: CommentsProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery({
            queryKey: ['comments', postId],
            queryFn: ({ pageParam }) =>
                apiFetch<Page<Comment>>(
                    `/posts/${postId}/comments?limit=${PAGE_SIZE}` +
                        (pageParam ? `&cursor=${pageParam}` : ''),
                ),
            initialPageParam: '',
            getNextPageParam: (last) => last.nextCursor ?? undefined,
        });

    const sentinelRef = useInfiniteScroll(
        () => void fetchNextPage(),
        hasNextPage && !isFetchingNextPage,
    );

    const [content, setContent] = useState('');
    const createComment = useMutation({
        mutationFn: (body: string) =>
            apiFetch<Comment>(`/posts/${postId}/comments`, {
                method: 'POST',
                body: { content: body },
            }),
        onSuccess: () => {
            setContent('');
            // Unlike voting, we don't patch the cache by hand — we just invalidate so the thread
            // refetches (the new comment has a server-assigned id/timestamp), and refresh the post so
            // its comment count ticks up.
            void queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            void queryClient.invalidateQueries({ queryKey: ['post', postId] });
        },
    });

    const comments = data?.pages.flatMap((page) => page.items) ?? [];

    return (
        <section className="comments">
            <h2>Comments</h2>

            {user ? (
                <form
                    className="comment-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (content.trim()) createComment.mutate(content);
                    }}
                >
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                    />
                    {createComment.isError && (
                        <p className="auth-error">{createComment.error.message}</p>
                    )}
                    <button type="submit" disabled={createComment.isPending || content.trim() === ''}>
                        {createComment.isPending ? 'Posting...' : 'Comment'}
                    </button>
                </form>
            ) : (
                <p className="comments-signin">Sign in to comment.</p>
            )}

            {isPending && <p className="status">Loading comments...</p>}
            {isError && <p className="status">Could not load comments: {error.message}</p>}

            {!isPending &&
                !isError &&
                (comments.length === 0 ? (
                    <p className="comments-empty">No comments yet.</p>
                ) : (
                    comments.map((c) => (
                        <article key={c.id} className="comment">
                            <p className="comment-meta">{c.author.username}</p>
                            <p className="comment-content">{c.content}</p>
                        </article>
                    ))
                ))}

            {hasNextPage && (
                <div ref={sentinelRef} className="load-more-sentinel">
                    {isFetchingNextPage ? 'Loading more...' : ''}
                </div>
            )}
        </section>
    );
}

export default Comments;
