import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import type { Post } from '../types';
import VoteButtons from '../components/VoteButtons';
import Comments from '../components/Comments';
import { CommentIcon } from '../components/icons';
import { PostCardSkeleton, ErrorMessage } from '../components/states';
import { timeAgo } from '../lib/time';

// A single post at /posts/:id — the post (same layout as a feed card, full content) then its thread.
function PostPage() {
    const { id } = useParams();

    const {
        data: post,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: ['post', id],
        queryFn: () => apiFetch<Post>(`/posts/${id}`),
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

                <h1 className="mb-2 text-2xl font-semibold">{post.title}</h1>

                <p className="mb-4 whitespace-pre-wrap text-heading">{post.content}</p>

                <div className="flex items-center gap-2">
                    <VoteButtons post={post} />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm text-muted">
                        <CommentIcon />
                        {post._count.comments}
                    </span>
                </div>
            </div>

            <Comments postId={post.id} />
        </>
    );
}

export default PostPage;
