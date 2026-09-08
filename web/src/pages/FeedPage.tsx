import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch, PAGE_SIZE } from '../api';
import type { Page, Post } from '../types';
import PostCard from '../components/PostCard';

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

            {/* Only render "Load more" while there's another page. fetchNextPage appends the next
                page to data.pages; isFetchingNextPage guards against double-clicks. */}
            {hasNextPage && (
                <button
                    type="button"
                    className="load-more"
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                >
                    {isFetchingNextPage ? 'Loading...' : 'Load more'}
                </button>
            )}
        </div>
    );
}

export default FeedPage;
