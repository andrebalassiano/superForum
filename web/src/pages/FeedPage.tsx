import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import type { Page, Post } from '../types';
import PostCard from '../components/PostCard';

// The home feed. Compare to the old version: no useState, no useEffect, no manual loading/error
// bookkeeping. useQuery declares "this component needs this data" and handles the rest.
function FeedPage() {
    // queryKey uniquely identifies + caches this data; queryFn is how to fetch it. Query gives back
    // the data plus status flags (isPending while there's no data yet, isError on a thrown error).
    const { data, isPending, isError, error } = useQuery({
        queryKey: ['posts'],
        queryFn: () => apiFetch<Page<Post>>('/posts'),
    });

    if (isPending) return <p className="status">Loading posts...</p>;
    if (isError) return <p className="status">Could not load posts: {error.message}</p>;

    return (
        <div className="feed">
            {data.items.length === 0 ? (
                <p className="status">No posts yet.</p>
            ) : (
                data.items.map((post) => <PostCard key={post.id} post={post} />)
            )}
        </div>
    );
}

export default FeedPage;
