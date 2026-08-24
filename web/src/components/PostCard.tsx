import type { Post } from '../types';

// A "presentational" component: hand it one post, it renders that post's card. It holds no state and
// fetches nothing — it just displays what it's given. Keeping display components dumb like this (data
// fetched high up, passed down as props) is the core React composition pattern.

// Props are a component's inputs — the equivalent of function parameters. We describe them with a
// TypeScript interface so a caller can't forget `post` or pass the wrong shape.
interface PostCardProps {
    post: Post;
}

// `{ post }` destructures the single props object, pulling out the `post` field.
function PostCard({ post }: PostCardProps) {
    return (
        <article className="post-card">
            <h2 className="post-title">{post.title}</h2>
            <p className="post-meta">
                {post.community.name} · by {post.author.username}
            </p>
            <p className="post-content">{post.content}</p>
            <p className="post-stats">
                {post.score} points · {post._count.comments} comments
            </p>
        </article>
    );
}

export default PostCard;
