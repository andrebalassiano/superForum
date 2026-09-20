export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const base =
    'inline-flex items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium ' +
    'cursor-pointer transition-colors disabled:cursor-default disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
    primary: 'bg-accent-soft text-accent border border-accent-line hover:opacity-90',
    secondary: 'bg-transparent text-heading border border-border hover:border-accent-line',
    ghost: 'bg-transparent border-0 text-muted hover:text-heading',
};

// The shared button look as a class string. <Button> uses it, and a <Link> that should LOOK like a
// button pulls it from here too (a <button> can't be nested inside an <a>). Kept in a non-component
// file so Button.tsx exports only the component, which keeps React Fast Refresh working.
export function buttonClasses(variant: ButtonVariant = 'primary', extra = '') {
    return `${base} ${variants[variant]} ${extra}`.trim();
}
