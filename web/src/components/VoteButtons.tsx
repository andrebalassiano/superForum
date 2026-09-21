import {
    useMutation,
    useQueryClient,
    type InfiniteData,
    type QueryClient,
} from '@tanstack/react-query';
import { apiFetch } from '../api';
import { useAuth } from '../auth/AuthContext';
import { Thumb } from './icons';
import type { Page, Post } from '../types';

interface VoteButtonsProps {
    post: Post;
}

// Matches only the post LIST caches: the home feed (['posts', sort]) and community feeds
// (['community', id, 'posts']). It must NOT match ['community', id] — that caches a Community object,
// not a paged post list, and the updater below assumes the paged shape.
function isPostListQuery(q: { queryKey: readonly unknown[] }) {
    return (
        q.queryKey[0] === 'posts' || (q.queryKey[0] === 'community' && q.queryKey[2] === 'posts')
    );
}

// Update this post everywhere it's cached — the single-post detail query AND every infinite list
// query (feed + communities) — so an optimistic vote shows up consistently across all views at once.
function patchPostInCaches(queryClient: QueryClient, postId: string, patch: (p: Post) => Post) {
    queryClient.setQueryData<Post>(['post', postId], (old) => (old ? patch(old) : old));

    queryClient.setQueriesData<InfiniteData<Page<Post>>>(
        { predicate: isPostListQuery },
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

// A horizontal pill (Reddit-style): thumb-up, score, thumb-down. The active vote is shown by a FILLED
// thumb in the strong text color; the inactive ones are outlined and muted. No red/green.
function VoteButtons({ post }: VoteButtonsProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (dir: 1 | -1) =>
            post.currentUserVote === dir
                ? apiFetch(`/posts/${post.id}/vote`, { method: 'DELETE' })
                : apiFetch(`/posts/${post.id}/vote`, { method: 'PUT', body: { value: dir } }),

        onMutate: async (dir: 1 | -1) => {
            await queryClient.cancelQueries();

            const removing = post.currentUserVote === dir;
            const newVote = removing ? null : dir;
            const scoreDelta = removing ? -dir : dir - (post.currentUserVote ?? 0);

            const previousDetail = queryClient.getQueryData<Post>(['post', post.id]);
            const previousLists = queryClient.getQueriesData<InfiniteData<Page<Post>>>({
                predicate: isPostListQuery,
            });

            patchPostInCaches(queryClient, post.id, (p) => ({
                ...p,
                currentUserVote: newVote,
                score: p.score + scoreDelta,
            }));

            return { previousDetail, previousLists };
        },

        onError: (_err, _dir, context) => {
            if (!context) return;
            queryClient.setQueryData(['post', post.id], context.previousDetail);
            context.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
        },
    });

    const cv = post.currentUserVote;
    // p-2 around a 20px icon gives a ~36px hit area — comfortable for thumbs on a phone.
    const iconButton =
        'rounded-full p-2 disabled:cursor-default disabled:opacity-50 enabled:cursor-pointer enabled:hover:text-heading';

    return (
        <div className="inline-flex items-center gap-1 rounded-full bg-surface px-1">
            <button
                type="button"
                onClick={() => mutation.mutate(1)}
                disabled={!user || mutation.isPending}
                title={user ? 'Upvote' : 'Sign in to vote'}
                aria-label="Upvote"
                aria-pressed={cv === 1}
                className={`${iconButton} ${cv === 1 ? 'text-heading' : 'text-muted'}`}
            >
                <Thumb filled={cv === 1} />
            </button>

            <span className="min-w-6 text-center text-sm font-semibold text-heading">
                {post.score}
            </span>

            <button
                type="button"
                onClick={() => mutation.mutate(-1)}
                disabled={!user || mutation.isPending}
                title={user ? 'Downvote' : 'Sign in to vote'}
                aria-label="Downvote"
                aria-pressed={cv === -1}
                className={`${iconButton} ${cv === -1 ? 'text-heading' : 'text-muted'}`}
            >
                <Thumb filled={cv === -1} down />
            </button>
        </div>
    );
}

export default VoteButtons;
