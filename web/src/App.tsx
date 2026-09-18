import { Routes, Route, Link } from 'react-router';
import { useAuth } from './auth/AuthContext';
import Button, { buttonClasses } from './components/Button';
import FeedPage from './pages/FeedPage';
import PostPage from './pages/PostPage';
import CommunityPage from './pages/CommunityPage';
import LoginPage from './pages/LoginPage';
import NewPostPage from './pages/NewPostPage';
import './App.css';

// App is the shell: a sticky header on every page plus a <Routes> block that swaps the page by URL.
function App() {
    const { user, signOut } = useAuth();

    return (
        <div>
            {/* Sticky so navigation is always reachable; bg-bg is opaque so content scrolls under it.
                Utilities like border-border / bg-bg / text-heading come from the theme tokens and flip
                for dark mode automatically. */}
            <header className="sticky top-0 z-10 border-b border-border bg-bg">
                {/* Full-width bar: title hard-left, nav hard-right (unlike the page content, which is
                    centered in a column below). */}
                <div className="flex h-14 items-center justify-between px-4">
                    <Link
                        to="/"
                        className="text-lg font-semibold text-heading no-underline hover:text-accent"
                    >
                        superForum
                    </Link>

                    <nav className="flex items-center gap-3">
                        {user ? (
                            <>
                                {/* Primary action — visually distinct from the account controls. A
                                    Link styled as a button via the shared buttonClasses. */}
                                <Link to="/submit" className={buttonClasses('primary')}>
                                    New post
                                </Link>
                                <span className="hidden text-sm text-muted sm:inline">
                                    {user.email}
                                </span>
                                <Button variant="ghost" onClick={() => void signOut()}>
                                    Sign out
                                </Button>
                            </>
                        ) : (
                            <Link to="/login" className={buttonClasses('secondary')}>
                                Sign in
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            {/* One shared content column for every page — pages no longer set their own width. */}
            <main className="mx-auto max-w-2xl px-4">
                <Routes>
                    <Route path="/" element={<FeedPage />} />
                    <Route path="/posts/:id" element={<PostPage />} />
                    <Route path="/communities/:id" element={<CommunityPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/submit" element={<NewPostPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
