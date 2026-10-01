// Turns an ISO timestamp into a short relative label ("just now", "3h ago", "2d ago"). Good enough
// for a feed; for exact times you'd show the full date on hover (a later nicety).
// "September 2026" — for a join date, where a relative label ("4mo ago") reads oddly and the exact
// day is noise. Locale-aware via toLocaleDateString rather than a hand-rolled month table.
export function monthYear(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function timeAgo(iso: string): string {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return 'just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;

    return `${Math.floor(months / 12)}y ago`;
}
