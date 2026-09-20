import { useParams, Link } from 'react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch, PAGE_SIZE } from '../api';
import type { Page, Post } from '../types';
import PostCard from '../components/PostCard';
import { PostCardSkeleton, EmptyState, ErrorMessage } from '../components/states';
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

    const backLink = (
        <Link to="/" className="mb-4 inline-block text-sm text-accent no-underline hover:underline">
            &larr; Back to feed
        </Link>
    );

    if (isPending) {
        return (
            <div className="pt-6 pb-16">
                {backLink}
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
            </div>
        );
    }
    if (isError) {
        return (
            <div className="pt-6 pb-16">
                {backLink}
                <ErrorMessage>Could not load community: {error.message}</ErrorMessage>
            </div>
        );
    }

    const posts = data.pages.flatMap((page) => page.items);
    // The community's name rides along on each post; read it off the first, or fall back.
    const communityName = posts[0]?.community.name ?? 'Community';

    return (
        <div className="pt-6 pb-16">
            {backLink}
            <h1 className="mb-6 text-2xl font-semibold">{communityName}</h1>

            {posts.length === 0 ? (
                <EmptyState
                    title="No posts in this community yet"
                    hint="Be the first to post here."
                />
            ) : (
                <>
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                    {hasNextPage && (
                        <div
                            ref={sentinelRef}
                            className="min-h-10 p-3 text-center text-sm text-muted"
                        >
                            {isFetchingNextPage ? 'Loading more...' : ''}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default CommunityPage;
