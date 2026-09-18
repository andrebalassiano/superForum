import type { ButtonHTMLAttributes } from 'react';

// One button system for the whole app. `variant` picks the look; everything else a <button> accepts
// (onClick, disabled, type, aria-*) flows straight through via ...props. In Tailwind, "shared
// styling" is a component like this, not a CSS class — the utilities live in one place and callers
// just pick a variant.
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
}

const base =
    'inline-flex items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium ' +
    'cursor-pointer transition-colors disabled:cursor-default disabled:opacity-50';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-accent-soft text-accent border border-accent-line hover:opacity-90',
    secondary: 'bg-transparent text-heading border border-border hover:border-accent-line',
    ghost: 'bg-transparent border-0 text-muted hover:text-heading',
};

function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
    return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export default Button;
