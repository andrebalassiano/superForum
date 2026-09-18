import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const base =
    'inline-flex items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium ' +
    'cursor-pointer transition-colors disabled:cursor-default disabled:opacity-50';

const variants: Record<Variant, string> = {
    primary: 'bg-accent-soft text-accent border border-accent-line hover:opacity-90',
    secondary: 'bg-transparent text-heading border border-border hover:border-accent-line',
    ghost: 'bg-transparent border-0 text-muted hover:text-heading',
};

// Shared class string. A <button> renders via <Button> below; a <Link> that should LOOK like a
// button can't nest a <button> inside an <a>, so it pulls the same classes from here — one source
// of truth for both.
export function buttonClasses(variant: Variant = 'primary', extra = '') {
    return `${base} ${variants[variant]} ${extra}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
}

function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
    return <button className={buttonClasses(variant, className)} {...props} />;
}

export default Button;
