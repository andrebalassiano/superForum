import { Component, type ErrorInfo, type ReactNode } from 'react';
import { buttonClasses } from './buttonStyles';

// The one place a class component is unavoidable: catching a render error needs the lifecycle
// hooks, and React has no hook equivalent. Without a boundary anywhere in the tree, an exception
// during render unmounts the whole app and the visitor is left staring at a blank white page with
// no way to tell whether the site is broken or still loading.
//
// Deliberately NOT a route-level boundary: this wraps the entire app in main.tsx, because the
// failure it exists for is the unexpected one, and there is no useful place to be more specific.
interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // No error-reporting service here, so the console is the only record. A production app
        // would send this to Sentry or similar.
        console.error('Unhandled render error:', error, info.componentStack);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="mx-auto max-w-md px-4 py-20 text-center">
                <h1 className="mb-3 text-2xl font-semibold">Something went wrong</h1>
                <p className="mb-6 text-muted">
                    The page hit an error it couldn't recover from. Reloading usually fixes it.
                </p>
                {/* A full reload rather than a state reset: whatever state caused the crash is
                    still in memory, so clearing the flag would likely just crash again. */}
                <button
                    type="button"
                    className={buttonClasses('primary')}
                    onClick={() => window.location.reload()}
                >
                    Reload the page
                </button>
            </div>
        );
    }
}

export default ErrorBoundary;
