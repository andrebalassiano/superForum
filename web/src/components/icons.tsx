// A single thumb shape (Material's thumb_up path) that reads well both solid and outlined — so one
// path serves both vote states: `filled` switches fill on/off, and `down` rotates it 180° for the
// downvote. Color comes from the parent's text color (currentColor), never green/red — the fill
// itself signals whether you've voted.
const THUMB_PATH =
    'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06' +
    'L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22' +
    'l3.02-7.05c.09-.23.14-.47.14-.73v-2z';

export function Thumb({
    filled,
    down = false,
    className = 'h-5 w-5',
}: {
    filled: boolean;
    down?: boolean;
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={`${className} ${down ? 'rotate-180' : ''}`}
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={THUMB_PATH} />
        </svg>
    );
}

// The two header actions, drawn instead of labelled once the bar gets narrow. Both are decorative
// here (aria-hidden) because the control around them carries an aria-label.
export function PlusIcon({ className = 'h-5 w-5' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

export function SignOutIcon({ className = 'h-5 w-5' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
    );
}

export function CommentIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}
