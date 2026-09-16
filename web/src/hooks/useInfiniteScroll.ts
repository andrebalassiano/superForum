import { useEffect, useRef } from 'react';

// A reusable custom hook (any function starting with `use` that calls other hooks). It returns a ref
// you attach to a "sentinel" element at the bottom of a list; when that element scrolls into view,
// `onIntersect` fires — used to auto-load the next page of an infinite query.
//
// `enabled` gates it (pass hasNextPage && !isFetchingNextPage) so we don't fire while a page is
// already loading or when there are no more pages.
export function useInfiniteScroll(onIntersect: () => void, enabled: boolean) {
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Keep the latest callback in a ref so the effect below doesn't need it as a dependency — that
    // way we don't tear down and rebuild the observer on every render, only when `enabled` changes.
    const callbackRef = useRef(onIntersect);
    callbackRef.current = onIntersect;

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !enabled) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                callbackRef.current();
            }
        });
        observer.observe(el);

        // Disconnect when enabled flips or the component unmounts, so we never leak an observer.
        return () => observer.disconnect();
    }, [enabled]);

    return sentinelRef;
}
