import type { ReactNode } from 'react';

// The app's "state" UI in one place: what to show while loading, when there's nothing, and when
// something failed. Every view reaches for these instead of ad-hoc text, so the states look
// consistent everywhere.

// ---- Loading skeletons ------------------------------------------------------------------------
// Placeholder blocks that mimic the real layout. `animate-pulse` is Tailwind's built-in shimmer;
// bg-surface keeps them subtle in both themes. Skeletons feel faster than a spinner or "Loading…"
// text because the page's shape is already on screen before the data arrives.

// motion-reduce:animate-none respects the OS "reduce motion" setting for users who find shimmer
// distracting or nauseating — the blocks just sit still.
function Bar({ className }: { className: string }) {
    return (
        <div
            className={`animate-pulse bg-surface motion-reduce:animate-none ${className}`}
            aria-hidden="true"
        />
    );
}

// Mirrors PostCard: metadata line, title, two content lines, then the two action pills.
export function PostCardSkeleton() {
    return (
        <div className="mb-3 rounded-lg border border-border p-4">
            <Bar className="mb-2 h-3 w-40 rounded" />
            <Bar className="mb-2 h-5 w-3/4 rounded" />
            <Bar className="mb-1 h-3 w-full rounded" />
            <Bar className="mb-3 h-3 w-5/6 rounded" />
            <div className="flex gap-2">
                <Bar className="h-8 w-24 rounded-full" />
                <Bar className="h-8 w-16 rounded-full" />
            </div>
        </div>
    );
}

// Mirrors a comment row: author line, then a content line.
export function CommentSkeleton() {
    return (
        <div className="border-t border-border py-3">
            <Bar className="mb-2 h-3 w-24 rounded" />
            <Bar className="h-3 w-full rounded" />
        </div>
    );
}

// ---- Empty state --------------------------------------------------------------------------------
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
    return (
        <div className="my-12 text-center">
            <p className="font-medium text-heading">{title}</p>
            {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
        </div>
    );
}

// ---- Error message ------------------------------------------------------------------------------
// role="alert" makes screen readers announce it when it appears. Used for both failed loads and
// failed form submits, so errors look the same wherever they happen.
export function ErrorMessage({ children }: { children: ReactNode }) {
    return (
        <div
            role="alert"
            className="my-4 rounded-md border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger"
        >
            {children}
        </div>
    );
}
