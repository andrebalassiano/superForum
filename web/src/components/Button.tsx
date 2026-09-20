import type { ButtonHTMLAttributes } from 'react';
import { buttonClasses, type ButtonVariant } from './buttonStyles';

// One button system for the whole app. `variant` picks the look; everything else a <button> accepts
// (onClick, disabled, type, aria-*) flows straight through via ...props. In Tailwind, "shared
// styling" is a component like this, not a CSS class — callers just pick a variant.
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
}

function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
    return <button className={buttonClasses(variant, className)} {...props} />;
}

export default Button;
