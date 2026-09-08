import { Link } from 'react-router';
import type { Post } from '../types';

// A "presentational" component: hand it one post, it renders that post's card. It holds no state and
// fetches nothing — it just displays what it's given, and links to the post and its community.

// Props are a component's inputs — the equivalent of function parameters. We describe them with a
// TypeScript interface so a caller can't forget `post` or pass the wrong shape.
interface PostCardProps {
    post: Post;
}

// `{ post }` destructures the single props object, pulling out the `post` field.
function PostCard({ post }: PostCardProps) {
    return (
        <article className="post-card">
            <h2 className="post-title">
                <Link to={`/posts/${post.id}`}>{post.title}</Link>
            </h2>
            <p className="post-meta">
                <Link to={`/communities/${post.community.id}`}>{post.community.name}</Link> · by{' '}
                {post.author.username}
            </p>
            <p className="post-content">{post.content}</p>
            <p className="post-stats">
                {post.score} points · {post._count.comments} comments
                {/* currentUserVote is null for anonymous readers; the backend fills it in once the
                    request carries a token — so this indicator only appears when you're signed in
                    and have voted on this post. */}
                {post.currentUserVote === 1 && <span className="your-vote up"> · you upvoted</span>}
                {post.currentUserVote === -1 && (
                    <span className="your-vote down"> · you downvoted</span>
                )}
            </p>
        </article>
    );
}

export default PostCard;
