import {
    useMutation,
    useQueryClient,
    type InfiniteData,
    type QueryClient,
} from '@tanstack/react-query';
import { apiFetch } from '../api';
import { useAuth } from '../auth/AuthContext';
import type { Page, Post } from '../types';

interface VoteButtonsProps {
    post: Post;
}

// Update this post everywhere it's cached — the single-post detail query AND every infinite list
// query (feed + communities) — so an optimistic vote shows up consistently across all views at once.
function patchPostInCaches(queryClient: QueryClient, postId: string, patch: (p: Post) => Post) {
    queryClient.setQueryData<Post>(['post', postId], (old) => (old ? patch(old) : old));

    queryClient.setQueriesData<InfiniteData<Page<Post>>>(
        { predicate: (q) => q.queryKey[0] === 'posts' || q.queryKey[0] === 'community' },
        (old) =>
            old
                ? {
                      ...old,
                      pages: old.pages.map((page) => ({
                          ...page,
                          items: page.items.map((p) => (p.id === postId ? patch(p) : p)),
                      })),
                  }
                : old,
    );
}

function VoteButtons({ post }: VoteButtonsProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        // Toggle semantics: clicking your current vote again removes it (DELETE); otherwise set it.
        mutationFn: (dir: 1 | -1) =>
            post.currentUserVote === dir
                ? apiFetch(`/posts/${post.id}/vote`, { method: 'DELETE' })
                : apiFetch(`/posts/${post.id}/vote`, { method: 'PUT', body: { value: dir } }),

        // onMutate runs BEFORE the request — this is the optimistic update.
        onMutate: async (dir: 1 | -1) => {
            // Stop in-flight refetches so they can't clobber our optimistic patch mid-request.
            await queryClient.cancelQueries();

            const removing = post.currentUserVote === dir;
            const newVote = removing ? null : dir;
            // The same delta the backend applies: increment score by (newValue - oldValue).
            const scoreDelta = removing ? -dir : dir - (post.currentUserVote ?? 0);

            // Snapshot the caches we're about to change, so onError can restore them exactly.
            const previousDetail = queryClient.getQueryData<Post>(['post', post.id]);
            const previousLists = queryClient.getQueriesData<InfiniteData<Page<Post>>>({
                predicate: (q) => q.queryKey[0] === 'posts' || q.queryKey[0] === 'community',
            });

            patchPostInCaches(queryClient, post.id, (p) => ({
                ...p,
                currentUserVote: newVote,
                score: p.score + scoreDelta,
            }));

            // Whatever we return here is passed to onError as `context`.
            return { previousDetail, previousLists };
        },

        // If the request fails, put the caches back exactly as they were.
        onError: (_err, _dir, context) => {
            if (!context) return;
            queryClient.setQueryData(['post', post.id], context.previousDetail);
            context.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
        },
        // No onSuccess refetch needed: our optimistic delta matches the backend's exactly, so the
        // cache is already correct once the request succeeds.
    });

    const cv = post.currentUserVote;

    return (
        <div className="votes">
            <button
                type="button"
                className={cv === 1 ? 'vote up active' : 'vote up'}
                onClick={() => mutation.mutate(1)}
                disabled={!user || mutation.isPending}
                title={user ? 'Upvote' : 'Sign in to vote'}
                aria-label="Upvote"
            >
                ▲
            </button>
            <span className="vote-score">{post.score}</span>
            <button
                type="button"
                className={cv === -1 ? 'vote down active' : 'vote down'}
                onClick={() => mutation.mutate(-1)}
                disabled={!user || mutation.isPending}
                title={user ? 'Downvote' : 'Sign in to vote'}
                aria-label="Downvote"
            >
                ▼
            </button>
        </div>
    );
}

export default VoteButtons;
