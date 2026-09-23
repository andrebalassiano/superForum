import { Routes, Route, Link, NavLink, useLocation } from 'react-router';
import { useAuth } from './auth/AuthContext';
import { useProfile } from './auth/useProfile';
import Button from './components/Button';
import { buttonClasses } from './components/buttonStyles';
import FeedPage from './pages/FeedPage';
import PostPage from './pages/PostPage';
import CommunityPage from './pages/CommunityPage';
import CommunitiesPage from './pages/CommunitiesPage';
import LoginPage from './pages/LoginPage';
import NewPostPage from './pages/NewPostPage';
import NewCommunityPage from './pages/NewCommunityPage';
import WelcomePage from './pages/WelcomePage';

// App is the shell: a sticky header on every page plus a <Routes> block that swaps the page by URL.
function App() {
    const { user, signOut } = useAuth();
    const profileQuery = useProfile();
    const { pathname } = useLocation();

    // Signed in, but the Profile row that posts and comments hang off doesn't exist (a 404 from
    // /auth/me, which useProfile turns into null). Every write would fail, so say so up front
    // rather than letting them discover it on a form. Hidden on /welcome, which is the fix itself.
    const needsProfile = !!user && profileQuery.data === null && pathname !== '/welcome';

    return (
        <div>
            {/* Skip link: invisible until a keyboard user tabs to it (sr-only → not-sr-only on
                focus), then jumps past the header straight to the content. Standard a11y practice. */}
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-20 focus:rounded-md focus:bg-bg focus:px-3 focus:py-2 focus:text-accent"
            >
                Skip to content
            </a>

            {/* Sticky so navigation is always reachable; bg-bg is opaque so content scrolls under it.
                Utilities like border-border / bg-bg / text-heading come from the theme tokens and flip
                for dark mode automatically. */}
            <header className="sticky top-0 z-10 border-b border-border bg-bg">
                {/* Full-width bar: title hard-left, nav hard-right (unlike the page content, which is
                    centered in a column below). Tighter gap on phones. */}
                <div className="flex h-14 items-center justify-between px-4">
                    <Link
                        to="/"
                        className="text-lg font-semibold text-heading no-underline hover:text-accent"
                    >
                        superForum
                    </Link>

                    <nav aria-label="Primary" className="flex items-center gap-2 sm:gap-3">
                        {/* NavLink is a Link that knows whether its route is active, so the browse
                            link highlights while you're on /communities. Public — everyone sees it. */}
                        <NavLink
                            to="/communities"
                            className={({ isActive }) =>
                                `px-1 text-sm no-underline ${
                                    isActive
                                        ? 'font-medium text-heading'
                                        : 'text-muted hover:text-heading'
                                }`
                            }
                        >
                            Communities
                        </NavLink>
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

            {needsProfile && (
                <div className="border-b border-accent-line bg-accent-soft">
                    <p className="mx-auto max-w-2xl px-4 py-2 text-sm text-heading">
                        Your account needs a username before you can post, comment, or vote.{' '}
                        <Link to="/welcome" className="text-accent underline">
                            Choose one
                        </Link>
                        .
                    </p>
                </div>
            )}

            {/* One shared content column for every page — pages no longer set their own width. */}
            <main id="main" className="mx-auto max-w-2xl px-4">
                <Routes>
                    <Route path="/" element={<FeedPage />} />
                    <Route path="/posts/:id" element={<PostPage />} />
                    <Route path="/communities" element={<CommunitiesPage />} />
                    {/* Static segment outranks the dynamic :id below, whatever the order. */}
                    <Route path="/communities/new" element={<NewCommunityPage />} />
                    <Route path="/communities/:id" element={<CommunityPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/welcome" element={<WelcomePage />} />
                    <Route path="/submit" element={<NewPostPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
