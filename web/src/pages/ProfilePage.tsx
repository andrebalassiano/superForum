import { useParams, useSearchParams, Link } from 'react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiFetch, PAGE_SIZE } from '../api';
import type { Page, Post, ProfileComment, PublicProfile } from '../types';
import PostCard from '../components/PostCard';
import CommentCard from '../components/CommentCard';
import { PostCardSkeleton, EmptyState, ErrorMessage } from '../components/states';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { monthYear } from '../lib/time';

const TABS = [
    { key: 'posts', label: 'Posts' },
    { key: 'comments', label: 'Comments' },
] as const;

// A user's profile at /u/:username — their reputation and join date, then their posts or their
// comments. The API serves the three pieces separately (the entity plus a paginated feed per tab),
// which is why there are three queries rather than one.
function ProfilePage() {
    const { username = '' } = useParams();

    // The active tab lives in the URL (?tab=comments) so it survives a refresh and can be linked to,
    // the same way the home feed keeps its sort there.
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') === 'comments' ? 'comments' : 'posts';

    // Keyed ['profiles', username] — plural, deliberately. ['profile', 'me'] is already useProfile's
    // key for the signed-in user's own row, and a user literally named "me" would otherwise collide
    // with it.
    const profileQuery = useQuery({
        queryKey: ['profiles', username],
        queryFn: () => apiFetch<PublicProfile>(`/profiles/${encodeURIComponent(username)}`),
    });

    // Both feeds are declared unconditionally and one is disabled, because a hook cannot be called
    // conditionally. The inactive tab costs nothing until it is selected.
    const postsQuery = useInfiniteQuery({
        queryKey: ['profiles', username, 'posts'],
        queryFn: ({ pageParam }) =>
            apiFetch<Page<Post>>(
                `/profiles/${encodeURIComponent(username)}/posts?limit=${PAGE_SIZE}` +
                    (pageParam ? `&cursor=${pageParam}` : ''),
            ),
        initialPageParam: '',
        getNextPageParam: (last) => last.nextCursor ?? undefined,
        enabled: tab === 'posts',
    });

    const commentsQuery = useInfiniteQuery({
        queryKey: ['profiles', username, 'comments'],
        queryFn: ({ pageParam }) =>
            apiFetch<Page<ProfileComment>>(
                `/profiles/${encodeURIComponent(username)}/comments?limit=${PAGE_SIZE}` +
                    (pageParam ? `&cursor=${pageParam}` : ''),
            ),
        initialPageParam: '',
        getNextPageParam: (last) => last.nextCursor ?? undefined,
        enabled: tab === 'comments',
    });

    const feed = tab === 'posts' ? postsQuery : commentsQuery;

    const sentinelRef = useInfiniteScroll(
        () => void feed.fetchNextPage(),
        feed.hasNextPage && !feed.isFetchingNextPage,
    );

    const backLink = (
        <Link to="/" className="mb-4 inline-block text-sm text-accent no-underline hover:underline">
            &larr; Back to feed
        </Link>
    );

    // A missing profile is the profile query's 404, not the feed's — the feeds 404 too, but this is
    // the query whose answer the page is actually about.
    if (profileQuery.isError) {
        return (
            <div className="pt-6 pb-16">
                {backLink}
                <ErrorMessage>Could not load profile: {profileQuery.error.message}</ErrorMessage>
            </div>
        );
    }

    const profile = profileQuery.data;

    const tabs = (
        <div
            role="group"
            aria-label="Profile sections"
            className="mb-4 flex gap-1 border-b border-border"
        >
            {TABS.map(({ key, label }) => (
                <button
                    key={key}
                    type="button"
                    aria-pressed={tab === key}
                    onClick={() => setSearchParams(key === 'posts' ? {} : { tab: key })}
                    className={`cursor-pointer border-b-2 px-3 py-2 text-sm ${
                        tab === key
                            ? 'border-accent font-semibold text-heading'
                            : 'border-transparent text-muted hover:text-heading'
                    }`}
                >
                    {label}
                    {profile && (
                        <span className="ml-1.5 text-xs text-muted">
                            {key === 'posts' ? profile._count.posts : profile._count.comments}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );

    return (
        <div className="pt-6 pb-16">
            {backLink}

            <header className="mb-6">
                <h1 className="wrap-break-word text-2xl font-semibold">
                    {profile?.username ?? username}
                </h1>
                {profile && (
                    <p className="mt-1 text-sm text-muted">
                        <span className="font-medium text-heading">{profile.reputation.total}</span>{' '}
                        reputation · joined {monthYear(profile.createdAt)}
                    </p>
                )}
            </header>

            {tabs}

            {feed.isPending ? (
                <>
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                </>
            ) : feed.isError ? (
                <ErrorMessage>
                    Could not load {tab}: {feed.error.message}
                </ErrorMessage>
            ) : tab === 'posts' ? (
                <PostsTab query={postsQuery} sentinelRef={sentinelRef} username={username} />
            ) : (
                <CommentsTab query={commentsQuery} sentinelRef={sentinelRef} username={username} />
            )}
        </div>
    );
}

// The two tabs are split out so each one can narrow its own page type. Sharing one body would mean
// a union of Post and ProfileComment that every branch has to re-narrow anyway.
function PostsTab({
    query,
    sentinelRef,
    username,
}: {
    query: ReturnType<typeof useInfiniteQuery<Page<Post>>>;
    sentinelRef: React.Ref<HTMLDivElement>;
    username: string;
}) {
    const posts = query.data?.pages.flatMap((page) => page.items) ?? [];

    if (posts.length === 0) {
        return <EmptyState title={`${username} hasn't posted yet`} />;
    }

    return (
        <>
            {posts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
            <LoadMore query={query} sentinelRef={sentinelRef} />
        </>
    );
}

function CommentsTab({
    query,
    sentinelRef,
    username,
}: {
    query: ReturnType<typeof useInfiniteQuery<Page<ProfileComment>>>;
    sentinelRef: React.Ref<HTMLDivElement>;
    username: string;
}) {
    const comments = query.data?.pages.flatMap((page) => page.items) ?? [];

    if (comments.length === 0) {
        return <EmptyState title={`${username} hasn't commented yet`} />;
    }

    return (
        <>
            {comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
            ))}
            <LoadMore query={query} sentinelRef={sentinelRef} />
        </>
    );
}

function LoadMore({
    query,
    sentinelRef,
}: {
    query: { hasNextPage: boolean; isFetchingNextPage: boolean };
    sentinelRef: React.Ref<HTMLDivElement>;
}) {
    if (!query.hasNextPage) return null;

    return (
        <div ref={sentinelRef} className="min-h-10 p-3 text-center text-sm text-muted">
            {query.isFetchingNextPage ? 'Loading more...' : ''}
        </div>
    );
}

export default ProfilePage;
