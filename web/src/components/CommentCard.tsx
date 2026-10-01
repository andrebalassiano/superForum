import { Link } from 'react-router';
import type { ProfileComment } from '../types';
import { timeAgo } from '../lib/time';

interface CommentCardProps {
    comment: ProfileComment;
}

// A comment shown away from its thread, on the comments tab of a profile. Deliberately read-only:
// no vote pill and no edit/delete. Voting here would mean teaching the cache about a fourth list
// shape, and editing a comment belongs in the thread where its replies are visible. The whole card
// is a link into that thread, which is what someone reading a profile actually wants.
function CommentCard({ comment }: CommentCardProps) {
    return (
        <article className="mb-3 rounded-lg border border-border bg-bg p-4 transition-colors hover:border-accent-line">
            <p className="mb-1 text-xs text-muted">
                on{' '}
                <Link
                    to={`/posts/${comment.post.id}`}
                    className="font-medium text-heading no-underline hover:underline"
                >
                    {comment.post.title}
                </Link>{' '}
                · {timeAgo(comment.createdAt)} · {comment.score} points
            </p>

            <p className="wrap-break-word whitespace-pre-wrap text-sm">{comment.content}</p>
        </article>
    );
}

export default CommentCard;
