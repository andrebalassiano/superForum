import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import type { Post } from '../types';

// A single post at /posts/:id.
function PostPage() {
    const { id } = useParams();

    // The queryKey includes `id`, so each post is cached under its own key. Navigating between posts
    // fetches (and caches) each; revisiting one shows the cached copy instantly. No [id] dependency
    // array to remember — the queryKey changing is what drives the refetch.
    const {
        data: post,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: ['post', id],
        queryFn: () => apiFetch<Post>(`/posts/${id}`),
    });

    if (isPending) return <p className="status">Loading post...</p>;
    // On a 404 the backend's envelope message ("Post not found") flows through apiFetch to here.
    if (isError) return <p className="status">Could not load post: {error.message}</p>;

    return (
        <article className="post-detail">
            <Link to="/" className="back-link">
                &larr; Back to feed
            </Link>
            <h1>{post.title}</h1>
            <p className="post-meta">
                <Link to={`/communities/${post.community.id}`}>{post.community.name}</Link> · by{' '}
                {post.author.username}
            </p>
            <p className="post-content">{post.content}</p>
            <p className="post-stats">
                {post.score} points · {post._count.comments} comments
            </p>
        </article>
    );
}

export default PostPage;
