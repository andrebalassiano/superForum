import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, PAGE_SIZE } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import Button from './Button';
import OwnerActions from './OwnerActions';
import { inputClasses } from './forms';
import { CommentSkeleton, EmptyState, ErrorMessage } from './states';
import { timeAgo } from '../lib/time';
import type { Comment, Page } from '../types';

interface CommentsProps {
    postId: string;
}

// One comment in the thread, with edit and delete for whoever wrote it. It's a separate component
// because each row needs its own editing state and its own two mutations — keeping that inside the
// list's map would mean hooks in a loop, which React doesn't allow.
function CommentItem({ comment, postId }: { comment: Comment; postId: string }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(comment.content);

    // Both mutations refresh the same two things: the thread, and the post (whose comment count
    // changes on delete).
    function refresh() {
        void queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        void queryClient.invalidateQueries({ queryKey: ['post', postId] });
    }

    const updateComment = useMutation({
        mutationFn: () =>
            apiFetch<Comment>(`/comments/${comment.id}`, {
                method: 'PATCH',
                body: { content: draft },
            }),
        onSuccess: () => {
            setEditing(false);
            refresh();
        },
    });

    const deleteComment = useMutation({
        mutationFn: () => apiFetch<void>(`/comments/${comment.id}`, { method: 'DELETE' }),
        onSuccess: refresh,
    });

    const isAuthor = !!user && user.id === comment.authorId;

    return (
        <article className="border-t border-border py-3">
            <p className="mb-1 text-xs text-muted">
                <span className="font-medium text-accent">{comment.author.username}</span> ·{' '}
                {timeAgo(comment.createdAt)}
            </p>

            {editing ? (
                <form
                    className="flex flex-col gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (draft.trim()) updateComment.mutate();
                    }}
                >
                    <textarea
                        aria-label="Edit comment"
                        className={`${inputClasses} resize-y`}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={3}
                    />
                    {updateComment.isError && (
                        <ErrorMessage>{updateComment.error.message}</ErrorMessage>
                    )}
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            className="px-3 py-1"
                            disabled={updateComment.isPending || draft.trim() === ''}
                        >
                            {updateComment.isPending ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="px-2 py-1"
                            onClick={() => {
                                // Drop the edit — put the draft back to what's on the server.
                                setDraft(comment.content);
                                setEditing(false);
                            }}
                            disabled={updateComment.isPending}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            ) : (
                <>
                    <p className="wrap-break-word whitespace-pre-wrap text-heading">
                        {comment.content}
                    </p>
                    {isAuthor && (
                        <div className="mt-1 -ml-2">
                            <OwnerActions
                                label="comment"
                                onEdit={() => setEditing(true)}
                                onDelete={() => deleteComment.mutate()}
                                isDeleting={deleteComment.isPending}
                            />
                        </div>
                    )}
                    {deleteComment.isError && (
                        <ErrorMessage>{deleteComment.error.message}</ErrorMessage>
                    )}
                </>
            )}
        </article>
    );
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
                    comments.map((c) => <CommentItem key={c.id} comment={c} postId={postId} />)
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
