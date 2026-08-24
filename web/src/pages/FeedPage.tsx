import { useEffect, useState } from 'react';
import { API_URL } from '../api';
import type { Post } from '../types';
import PostCard from '../components/PostCard';

// The home feed — the fetch logic that used to live in App, now its own page component so App can
// route to it. (Step 5 replaces this fetch/useState/useEffect trio with TanStack Query.)
function FeedPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/posts`)
            .then((res) => {
                if (!res.ok) throw new Error(`Request failed (${res.status})`);
                return res.json();
            })
            .then((data) => setPosts(data.items))
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Unknown error');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="status">Loading posts...</p>;
    if (error) return <p className="status">Could not load posts: {error}</p>;

    return (
        <div className="feed">
            {posts.length === 0 ? (
                <p className="status">No posts yet.</p>
            ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
        </div>
    );
}

export default FeedPage;
