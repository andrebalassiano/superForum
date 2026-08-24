import { Routes, Route, Link } from 'react-router';
import FeedPage from './pages/FeedPage';
import PostPage from './pages/PostPage';
import CommunityPage from './pages/CommunityPage';
import './App.css';

// App is now a "shell": a header that shows on every page, plus a <Routes> block that swaps the
// page component based on the current URL. The pages themselves do the data-fetching.
function App() {
    return (
        <div className="app">
            <header className="app-header">
                {/* <Link> renders an <a>, but navigating with it does NOT reload the page — the
                    router intercepts the click and swaps the view in place. That's the SPA
                    difference from a plain <a href>. */}
                <Link to="/" className="app-title">
                    superForum
                </Link>
            </header>

            <main className="app-main">
                {/* Routes compares the URL to each Route's path and renders the first match.
                    ":id" is a URL parameter the matched page reads back with useParams(). */}
                <Routes>
                    <Route path="/" element={<FeedPage />} />
                    <Route path="/posts/:id" element={<PostPage />} />
                    <Route path="/communities/:id" element={<CommunityPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
