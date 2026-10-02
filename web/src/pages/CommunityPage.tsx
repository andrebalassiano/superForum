import { useParams, Link, useNavigate } from 'react-router';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, PAGE_SIZE } from '../api';
import type { CommunityDetail, Page, Post } from '../types';
import { useAuth } from '../auth/AuthContext';
import OwnerActions from '../components/OwnerActions';
import PostCard from '../components/PostCard';
import { PostCardSkeleton, EmptyState, ErrorMessage } from '../components/states';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

// One community's posts at /communities/:id — same paginated pattern as the home feed, scoped to
// GET /communities/:id/posts.
function CommunityPage() {
    const { id } = useParams();

    // The community itself, for its name — so an empty community still shows a real heading rather
    // than the fallback. Runs alongside the posts query; TanStack fires both in parallel.
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const communityQuery = useQuery({
        queryKey: ['community', id],
        queryFn: () => apiFetch<CommunityDetail>(`/communities/${id}`),
    });

    // Invalidate-and-refetch rather than an optimistic removal: there is nothing useful to guess at,
    // and we navigate away from this page immediately anyway. Invalidating ['communities'] also
    // refreshes ['communities', 'all'], the post form's picker, by prefix match.
    const deleteCommunity = useMutation({
        mutationFn: () => apiFetch<void>(`/communities/${id}`, { method: 'DELETE' }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['communities'] });
            void navigate('/communities');
        },
    });

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
    // Prefer the community query's name; fall back to the name riding on the first post (usually
    // available sooner, since both requests race), then a generic label.
    const communityName = communityQuery.data?.name ?? posts[0]?.community.name ?? 'Community';

    // Owner-only, and only while the community is empty. Both are cosmetic: the API re-checks
    // ownership and refuses a non-empty delete regardless of what the client chose to draw.
    const isOwner = !!user && communityQuery.data?.ownerId === user.id;
    const postCount = communityQuery.data?._count.posts ?? 0;
    const hasPosts = postCount > 0;

    return (
        <div className="pt-6 pb-16">
            {backLink}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <h1 className="wrap-break-word text-2xl font-semibold">{communityName}</h1>
                {isOwner &&
                    (hasPosts ? (
                        // Say why instead of offering a button the API will refuse with a 409. The
                        // rule is enforced server-side; this only explains it.
                        <span className="text-sm text-muted">
                            Delete the {postCount} {postCount === 1 ? 'post' : 'posts'} in here
                            before deleting the community
                        </span>
                    ) : (
                        <OwnerActions
                            label="community"
                            onDelete={() => deleteCommunity.mutate()}
                            isDeleting={deleteCommunity.isPending}
                        />
                    ))}
            </div>

            {deleteCommunity.isError && (
                <ErrorMessage>{deleteCommunity.error.message}</ErrorMessage>
            )}

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
