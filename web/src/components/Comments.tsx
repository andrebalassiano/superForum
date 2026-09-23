import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, PAGE_SIZE } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import Button from './Button';
import { inputClasses } from './forms';
import { CommentSkeleton, EmptyState, ErrorMessage } from './states';
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
        <section className="pb-16">
            <h2 className="mt-6 mb-3 border-t border-border pt-6 text-xl font-semibold">
                Comments
            </h2>

            {user ? (
                <form
                    className="mb-6 flex flex-col gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (content.trim()) createComment.mutate(content);
                    }}
                >
                    {/* No visible label (the placeholder does that job visually), so aria-label
                        gives screen readers the name instead. */}
                    <textarea
                        aria-label="Add a comment"
                        className={`${inputClasses} resize-y`}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                    />
                    {createComment.isError && (
                        <ErrorMessage>{createComment.error.message}</ErrorMessage>
                    )}
                    <Button
                        type="submit"
                        className="self-start"
                        disabled={createComment.isPending || content.trim() === ''}
                    >
                        {createComment.isPending ? 'Posting...' : 'Comment'}
                    </Button>
                </form>
            ) : (
                <p className="mb-4 text-sm text-muted">Sign in to comment.</p>
            )}

            {isPending && (
                <>
                    <CommentSkeleton />
                    <CommentSkeleton />
                    <CommentSkeleton />
                </>
            )}
            {isError && <ErrorMessage>Could not load comments: {error.message}</ErrorMessage>}

            {!isPending &&
                !isError &&
                (comments.length === 0 ? (
                    <EmptyState title="No comments yet" hint="Start the conversation." />
                ) : (
                    comments.map((c) => (
                        <article key={c.id} className="border-t border-border py-3">
                            <p className="mb-1 text-xs font-medium text-accent">
                                {c.author.username}
                            </p>
                            <p className="wrap-break-word whitespace-pre-wrap text-heading">
                                {c.content}
                            </p>
                        </article>
                    ))
                ))}

            {hasNextPage && (
                <div ref={sentinelRef} className="min-h-10 p-3 text-center text-sm text-muted">
                    {isFetchingNextPage ? 'Loading more...' : ''}
                </div>
            )}
        </section>
    );
}

export default Comments;
