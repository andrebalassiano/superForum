import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch, PAGE_SIZE } from '../api';
import type { Page, Post } from '../types';
import PostCard from '../components/PostCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

// The home feed, now paginated. useInfiniteQuery is useQuery's sibling for "load more" data: instead
// of one result it keeps an array of pages, and knows how to fetch the next one.
function FeedPage() {
    const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery({
            queryKey: ['posts'],
            // queryFn now receives a pageParam — the cursor for the page to fetch. First page has no
            // cursor; later pages pass the previous page's nextCursor.
            queryFn: ({ pageParam }) =>
                apiFetch<Page<Post>>(
                    `/posts?limit=${PAGE_SIZE}` + (pageParam ? `&cursor=${pageParam}` : ''),
                ),
            // The cursor to use for the very first fetch (empty = "start from the top").
            initialPageParam: '',
            // Given the last page we loaded, what's the cursor for the next one? Returning undefined
            // means "no more pages" — which is exactly what nextCursor: null signals.
            getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        });

    // Attach this ref to the sentinel below; when it scrolls into view the next page auto-loads.
    // Hooks must run before any early return, so this sits above the loading/error guards.
    const sentinelRef = useInfiniteScroll(
        () => void fetchNextPage(),
        hasNextPage && !isFetchingNextPage,
    );

    if (isPending) return <p className="status">Loading posts...</p>;
    if (isError) return <p className="status">Could not load posts: {error.message}</p>;

    // data.pages is an array of pages ({ items, nextCursor }); flatten to one list of posts.
    const posts = data.pages.flatMap((page) => page.items);

    if (posts.length === 0) return <p className="status">No posts yet.</p>;

    return (
        <div className="feed">
            {posts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}

            {/* The sentinel: rendered only while another page exists. When it enters the viewport,
                the hook fires fetchNextPage, which appends the next page to data.pages. */}
            {hasNextPage && (
                <div ref={sentinelRef} className="load-more-sentinel">
                    {isFetchingNextPage ? 'Loading more...' : ''}
                </div>
            )}
        </div>
    );
}

export default FeedPage;
