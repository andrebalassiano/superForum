import { Link } from 'react-router';
import type { Post } from '../types';
import VoteButtons from './VoteButtons';
import { CommentIcon } from './icons';
import { timeAgo } from '../lib/time';

interface PostCardProps {
    post: Post;
}

// A feed card in the current Reddit layout: metadata line on top, then the title and a content
// preview, then a horizontal action bar (vote pill + comment pill).
function PostCard({ post }: PostCardProps) {
    return (
        <article className="mb-3 rounded-lg border border-border bg-bg p-4 transition-colors hover:border-accent-line">
            <p className="mb-1 text-xs text-muted">
                <Link
                    to={`/communities/${post.community.id}`}
                    className="font-medium text-heading no-underline hover:underline"
                >
                    {post.community.name}
                </Link>{' '}
                · by {post.author.username} · {timeAgo(post.createdAt)}
            </p>

            <h2 className="mb-1 text-lg font-semibold">
                <Link
                    to={`/posts/${post.id}`}
                    className="text-heading no-underline hover:underline"
                >
                    {post.title}
                </Link>
            </h2>

            <p className="mb-3 line-clamp-3 whitespace-pre-wrap text-sm text-muted">
                {post.content}
            </p>

            <div className="flex items-center gap-2">
                <VoteButtons post={post} />
                <Link
                    to={`/posts/${post.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm text-muted no-underline hover:text-heading"
                >
                    <CommentIcon />
                    {post._count.comments}
                </Link>
            </div>
        </article>
    );
}

export default PostCard;
