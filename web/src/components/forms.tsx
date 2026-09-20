import type { ReactNode } from 'react';

// Shared form primitives so every input/select/textarea looks the same and is a comfortable touch
// target (py-2.5 makes them ~44px tall — the usual mobile minimum). Keyboard focus rings come from
// the global :focus-visible rule in index.css.
export const inputClasses =
    'w-full rounded-md border border-border bg-bg px-3 py-2.5 text-heading placeholder:text-muted';

// Wrapping the control inside the <label> associates them implicitly: clicking the text focuses
// the control, and screen readers announce the label with it — no id/htmlFor plumbing needed.
export function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="flex flex-col gap-1 text-sm text-muted">
            {label}
            {children}
        </label>
    );
}
