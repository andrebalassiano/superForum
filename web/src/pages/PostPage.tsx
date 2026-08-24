import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { API_URL } from '../api';
import type { Post } from '../types';

// A single post at /posts/:id. This is where useParams earns its keep.
function PostPage() {
    // useParams reads the dynamic segments of the URL. Our route is "/posts/:id", so we get { id }.
    // It's typed string | undefined — the router can't statically prove the segment is present.
    const { id } = useParams();

    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // `id` is in the dependency array: navigating from one post straight to another reuses this
    // component (no unmount), so the effect must re-run when the id changes to fetch the new post.
    useEffect(() => {
        fetch(`${API_URL}/posts/${id}`)
            .then((res) => {
                if (res.status === 404) throw new Error('Post not found');
                if (!res.ok) throw new Error(`Request failed (${res.status})`);
                return res.json();
            })
            .then((data) => setPost(data)) // GET /posts/:id returns the post directly, not an envelope
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Unknown error');
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <p className="status">Loading post...</p>;
    if (error) return <p className="status">Could not load post: {error}</p>;
    if (!post) return null;

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
