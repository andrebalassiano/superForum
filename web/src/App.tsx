import { Routes, Route, Link } from 'react-router';
import { useAuth } from './auth/AuthContext';
import FeedPage from './pages/FeedPage';
import PostPage from './pages/PostPage';
import CommunityPage from './pages/CommunityPage';
import LoginPage from './pages/LoginPage';
import './App.css';

// App is the shell: a header on every page plus a <Routes> block that swaps the page by URL.
function App() {
    // Reading auth state via the context — no props threaded down from main.tsx.
    const { user, signOut } = useAuth();

    return (
        <div className="app">
            <header className="app-header">
                <Link to="/" className="app-title">
                    superForum
                </Link>

                {/* The header reflects who's signed in: the user's email + sign-out when logged in,
                    a sign-in link otherwise. `void` marks the promise from signOut as intentionally
                    unhandled here (the header doesn't need to await it). */}
                <nav className="app-nav">
                    {user ? (
                        <>
                            <span className="app-user">{user.email}</span>
                            <button type="button" onClick={() => void signOut()}>
                                Sign out
                            </button>
                        </>
                    ) : (
                        <Link to="/login">Sign in</Link>
                    )}
                </nav>
            </header>

            <main className="app-main">
                <Routes>
                    <Route path="/" element={<FeedPage />} />
                    <Route path="/posts/:id" element={<PostPage />} />
                    <Route path="/communities/:id" element={<CommunityPage />} />
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
