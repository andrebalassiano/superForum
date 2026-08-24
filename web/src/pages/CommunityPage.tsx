import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { API_URL } from '../api';
import type { Post } from '../types';
import PostCard from '../components/PostCard';

// One community's posts at /communities/:id — hits GET /communities/:id/posts, the endpoint you
// promoted from dead code back in the backend #5 work. Reuses PostCard, same as the feed.
function CommunityPage() {
    const { id } = useParams();

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/communities/${id}/posts`)
            .then((res) => {
                if (!res.ok) throw new Error(`Request failed (${res.status})`);
                return res.json();
            })
            .then((data) => setPosts(data.items))
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Unknown error');
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <p className="status">Loading community...</p>;
    if (error) return <p className="status">Could not load community: {error}</p>;

    // The community's name rides along on each post (post.community.name). Read it off the first one,
    // falling back to a generic heading when the community has no posts yet.
    const communityName = posts[0]?.community.name ?? 'Community';

    return (
        <div className="feed">
            <Link to="/" className="back-link">
                &larr; Back to feed
            </Link>
            <h1>{communityName}</h1>
            {posts.length === 0 ? (
                <p className="status">No posts in this community yet.</p>
            ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
        </div>
    );
}

export default CommunityPage;
