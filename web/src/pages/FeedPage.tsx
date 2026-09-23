import { useSearchParams } from 'react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch, PAGE_SIZE } from '../api';
import type { Page, Post } from '../types';
import PostCard from '../components/PostCard';
import { PostCardSkeleton, EmptyState, ErrorMessage } from '../components/states';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const SORTS = [
    { key: 'new', label: 'New' },
    { key: 'top', label: 'Top' },
] as const;

// The home feed, with New/Top sort tabs that drive the backend's ?sort= param.
function FeedPage() {
    // The active sort lives in the URL (?sort=top), so it's shareable and survives a refresh.
    // useSearchParams is React Router's read/write handle on the query string.
    const [searchParams, setSearchParams] = useSearchParams();
    const sort = searchParams.get('sort') === 'top' ? 'top' : 'new';

    const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery({
            // sort is part of the key, so each sort caches separately and switching refetches.
            // (VoteButtons' cache patch still matches on queryKey[0] === 'posts', so votes keep
            // working across both.)
            queryKey: ['posts', sort],
            queryFn: ({ pageParam }) =>
                apiFetch<Page<Post>>(
                    `/posts?limit=${PAGE_SIZE}&sort=${sort}` +
                        (pageParam ? `&cursor=${pageParam}` : ''),
                ),
            initialPageParam: '',
            getNextPageParam: (last) => last.nextCursor ?? undefined,
        });

    const sentinelRef = useInfiniteScroll(
        () => void fetchNextPage(),
        hasNextPage && !isFetchingNextPage,
    );

    // Rendered in every branch so the tabs stay put while the feed loads/errors. The group has a
    // name for screen readers, and aria-pressed tells them which sort is active (they're toggle
    // buttons — the underline alone is visual-only).
    const tabs = (
        <div
            role="group"
            aria-label="Sort posts"
            className="mb-4 flex gap-1 border-b border-border"
        >
            {SORTS.map(({ key, label }) => (
                <button
                    key={key}
                    type="button"
                    aria-pressed={sort === key}
                    // Omit the param for the default ('new') to keep the URL clean.
                    onClick={() => setSearchParams(key === 'new' ? {} : { sort: key })}
                    className={`-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-medium ${
                        sort === key
                            ? 'border-accent text-heading'
                            : 'border-transparent text-muted hover:text-heading'
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );

    if (isPending) {
        return (
            <div className="pt-6 pb-16">
                {tabs}
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
            </div>
        );
    }
    if (isError) {
        return (
            <div className="pt-6 pb-16">
                {tabs}
                <ErrorMessage>Could not load posts: {error.message}</ErrorMessage>
            </div>
        );
    }

    const posts = data.pages.flatMap((page) => page.items);

    return (
        <div className="pt-6 pb-16">
            {tabs}
            {posts.length === 0 ? (
                <EmptyState title="No posts yet" hint="Be the first to post something." />
            ) : (
                posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
            {hasNextPage && (
                <div ref={sentinelRef} className="min-h-10 p-3 text-center text-sm text-muted">
                    {isFetchingNextPage ? 'Loading more...' : ''}
                </div>
            )}
        </div>
    );
}

export default FeedPage;
