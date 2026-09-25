import { Link } from 'react-router';
import { buttonClasses } from '../components/buttonStyles';

// Catches any URL no other route matches. Without it an unknown path rendered the header above an
// empty page, which reads as broken rather than as "no such page".
function NotFoundPage() {
    return (
        <div className="py-20 text-center">
            <p className="mb-2 text-sm font-medium text-muted">404</p>
            <h1 className="mb-3 text-2xl font-semibold">This page doesn't exist</h1>
            <p className="mb-6 text-muted">
                The link may be wrong, or whatever was here has since been deleted.
            </p>
            <Link to="/" className={buttonClasses('primary')}>
                Back to the feed
            </Link>
        </div>
    );
}

export default NotFoundPage;
