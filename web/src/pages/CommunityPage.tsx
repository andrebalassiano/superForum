import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import type { Page, Post } from '../types';
import PostCard from '../components/PostCard';

// One community's posts at /communities/:id — hits GET /communities/:id/posts.
function CommunityPage() {
    const { id } = useParams();

    const { data, isPending, isError, error } = useQuery({
        queryKey: ['community', id, 'posts'],
        queryFn: () => apiFetch<Page<Post>>(`/communities/${id}/posts`),
    });

    if (isPending) return <p className="status">Loading community...</p>;
    if (isError) return <p className="status">Could not load community: {error.message}</p>;

    // The community's name rides along on each post; read it off the first, or fall back.
    const communityName = data.items[0]?.community.name ?? 'Community';

    return (
        <div className="feed">
            <Link to="/" className="back-link">
                &larr; Back to feed
            </Link>
            <h1>{communityName}</h1>
            {data.items.length === 0 ? (
                <p className="status">No posts in this community yet.</p>
            ) : (
                data.items.map((post) => <PostCard key={post.id} post={post} />)
            )}
        </div>
    );
}

export default CommunityPage;
