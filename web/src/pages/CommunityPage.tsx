import { useParams, Link } from 'react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch, PAGE_SIZE } from '../api';
import type { Page, Post } from '../types';
import PostCard from '../components/PostCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

// One community's posts at /communities/:id — same paginated pattern as the home feed, scoped to
// GET /communities/:id/posts.
function CommunityPage() {
    const { id } = useParams();

    const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery({
            queryKey: ['community', id, 'posts'],
            queryFn: ({ pageParam }) =>
                apiFetch<Page<Post>>(
                    `/communities/${id}/posts?limit=${PAGE_SIZE}` +
                        (pageParam ? `&cursor=${pageParam}` : ''),
                ),
            initialPageParam: '',
            getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        });

    const sentinelRef = useInfiniteScroll(
        () => void fetchNextPage(),
        hasNextPage && !isFetchingNextPage,
    );

    if (isPending) return <p className="status">Loading community...</p>;
    if (isError) return <p className="status">Could not load community: {error.message}</p>;

    const posts = data.pages.flatMap((page) => page.items);
    // The community's name rides along on each post; read it off the first, or fall back.
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
                <>
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                    {hasNextPage && (
                        <div ref={sentinelRef} className="load-more-sentinel">
                            {isFetchingNextPage ? 'Loading more...' : ''}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default CommunityPage;
