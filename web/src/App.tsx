import { useEffect, useState } from 'react';
import type { Post } from './types';
import PostCard from './components/PostCard';
import './App.css';

// Where the backend lives. Hardcoded for now — we'll move it to a Vite env var in a later step.
const API_URL = 'http://localhost:3000/api';

function App() {
    // Three pieces of state that together describe "loading data from a server": the data itself,
    // whether we're still waiting, and any error. (Step 5 replaces all of this with TanStack Query.)
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // useEffect runs a side-effect AFTER the first render. The empty dependency array [] means "run
    // once, on mount" — so we fetch exactly once, not on every re-render.
    useEffect(() => {
        fetch(`${API_URL}/posts`)
            .then((res) => {
                if (!res.ok) throw new Error(`Request failed (${res.status})`);
                return res.json();
            })
            .then((data) => {
                // GET /posts returns the { items, nextCursor } envelope — the posts are in `items`.
                setPosts(data.items);
            })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Unknown error');
            })
            .finally(() => setLoading(false));
    }, []);

    // Early returns keep the main JSX clean — we show one of these while loading or on failure.
    if (loading) return <p className="status">Loading posts…</p>;
    if (error) return <p className="status">Could not load posts: {error}</p>;

    return (
        <main className="feed">
            <h1>superForum</h1>
            {posts.length === 0 ? (
                <p className="status">No posts yet.</p>
            ) : (
                // `key` gives React a stable identity per row so it updates the list efficiently.
                posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
        </main>
    );
}

export default App;
