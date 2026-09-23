import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { useAuth } from '../auth/AuthContext';
import type { Post } from '../types';
import VoteButtons from '../components/VoteButtons';
import Comments from '../components/Comments';
import Button from '../components/Button';
import OwnerActions from '../components/OwnerActions';
import { Field, inputClasses } from '../components/forms';
import { CommentIcon } from '../components/icons';
import { PostCardSkeleton, ErrorMessage } from '../components/states';
import { timeAgo } from '../lib/time';

// A single post at /posts/:id — the post (same layout as a feed card, full content) then its thread.
// Its author also gets edit and delete here; the feed deliberately doesn't offer them, so a
// destructive action always happens on the page showing the whole post.
function PostPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Edit state lives here rather than on a route: it's a mode of this view, not a place you can
    // link to or land on.
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const {
        data: post,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: ['post', id],
        queryFn: () => apiFetch<Post>(`/posts/${id}`),
    });

    const updatePost = useMutation({
        mutationFn: () =>
            apiFetch<Post>(`/posts/${id}`, { method: 'PATCH', body: { title, content } }),
        onSuccess: () => {
            setEditing(false);
            // The post itself, and every feed that shows it.
            void queryClient.invalidateQueries({ queryKey: ['post', id] });
            void queryClient.invalidateQueries({ queryKey: ['posts'] });
            void queryClient.invalidateQueries({ queryKey: ['community'] });
        },
    });

    const deletePost = useMutation({
        mutationFn: () => apiFetch<void>(`/posts/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['posts'] });
            void queryClient.invalidateQueries({ queryKey: ['community'] });
            // Nothing to come back to — the post is gone.
            void navigate('/');
        },
    });

    if (isPending) {
        return (
            <div className="pt-2 pb-8">
                <PostCardSkeleton />
            </div>
        );
    }
    if (isError) {
        return (
            <div className="pt-2 pb-8">
                <ErrorMessage>Could not load post: {error.message}</ErrorMessage>
            </div>
        );
    }

    // Ownership is the server's call; this only decides what to render. Comparing the Supabase user
    // id to the post's authorId works because a Profile's id IS the auth user's id.
    const isAuthor = !!user && user.id === post.authorId;

    function startEditing(p: Post) {
        setTitle(p.title);
        setContent(p.content);
        setEditing(true);
    }

    return (
        <>
            <div className="pt-2 pb-8">
                <Link
                    to="/"
                    className="mb-3 inline-block text-sm text-accent no-underline hover:underline"
                >
                    &larr; Back to feed
                </Link>

                <p className="mb-1 text-xs text-muted">
                    <Link
                        to={`/communities/${post.community.id}`}
                        className="font-medium text-heading no-underline hover:underline"
                    >
                        {post.community.name}
                    </Link>{' '}
                    · by {post.author.username} · {timeAgo(post.createdAt)}
                </p>

                {editing ? (
                    <form
                        className="mt-3 mb-4 flex flex-col gap-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (title.trim() && content.trim()) updatePost.mutate();
                        }}
                    >
                        <Field label="Title">
                            <input
                                type="text"
                                className={inputClasses}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </Field>
                        <Field label="Content">
                            <textarea
                                className={`${inputClasses} resize-y`}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={8}
                                required
                            />
                        </Field>

                        {updatePost.isError && (
                            <ErrorMessage>{updatePost.error.message}</ErrorMessage>
                        )}

                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                disabled={
                                    updatePost.isPending ||
                                    title.trim() === '' ||
                                    content.trim() === ''
                                }
                            >
                                {updatePost.isPending ? 'Saving...' : 'Save changes'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setEditing(false)}
                                disabled={updatePost.isPending}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <>
                        <h1 className="mb-2 wrap-break-word text-2xl font-semibold">
                            {post.title}
                        </h1>

                        <p className="mb-4 wrap-break-word whitespace-pre-wrap text-heading">
                            {post.content}
                        </p>
                    </>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <VoteButtons post={post} />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm text-muted">
                        <CommentIcon />
                        {post._count.comments}
                    </span>

                    {/* Pushed to the far end so the destructive action isn't next to the thumbs. */}
                    {isAuthor && !editing && (
                        <div className="ml-auto">
                            <OwnerActions
                                label="post"
                                onEdit={() => startEditing(post)}
                                onDelete={() => deletePost.mutate()}
                                isDeleting={deletePost.isPending}
                            />
                        </div>
                    )}
                </div>

                {deletePost.isError && (
                    <div className="mt-3">
                        <ErrorMessage>{deletePost.error.message}</ErrorMessage>
                    </div>
                )}
            </div>

            <Comments postId={post.id} />
        </>
    );
}

export default PostPage;
