import { Link } from 'react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch, PAGE_SIZE } from '../api';
import type { Community, Page } from '../types';
import { ListSkeleton, EmptyState, ErrorMessage } from '../components/states';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

// Browse every community at /communities — the discovery surface for GET /communities, which was
// otherwise only reachable by already knowing a community's URL. Same paginated infinite-scroll
// pattern as the feeds.
function CommunitiesPage() {
    const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery({
            queryKey: ['communities'],
            queryFn: ({ pageParam }) =>
                apiFetch<Page<Community>>(
                    `/communities?limit=${PAGE_SIZE}` + (pageParam ? `&cursor=${pageParam}` : ''),
                ),
            initialPageParam: '',
            getNextPageParam: (last) => last.nextCursor ?? undefined,
        });

    const sentinelRef = useInfiniteScroll(
        () => void fetchNextPage(),
        hasNextPage && !isFetchingNextPage,
    );

    const heading = <h1 className="mb-4 text-2xl font-semibold">Communities</h1>;

    if (isPending) {
        return (
            <div className="pt-6 pb-16">
                {heading}
                <ListSkeleton />
            </div>
        );
    }
    if (isError) {
        return (
            <div className="pt-6 pb-16">
                {heading}
                <ErrorMessage>Could not load communities: {error.message}</ErrorMessage>
            </div>
        );
    }

    const communities = data.pages.flatMap((page) => page.items);

    return (
        <div className="pt-6 pb-16">
            {heading}

            {communities.length === 0 ? (
                <EmptyState title="No communities yet" />
            ) : (
                // divide-y draws a border between rows; the outer border + rounding frames the list.
                <ul className="divide-y divide-border rounded-lg border border-border">
                    {communities.map((community) => (
                        <li key={community.id}>
                            <Link
                                to={`/communities/${community.id}`}
                                className="block px-4 py-3 font-medium text-heading no-underline transition-colors hover:bg-surface"
                            >
                                {community.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {hasNextPage && (
                <div ref={sentinelRef} className="min-h-10 p-3 text-center text-sm text-muted">
                    {isFetchingNextPage ? 'Loading more...' : ''}
                </div>
            )}
        </div>
    );
}

export default CommunitiesPage;
