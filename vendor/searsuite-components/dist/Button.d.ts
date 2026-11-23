import type { ButtonHTMLAttributes } from 'react';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'action' | 'feedback' | 'group';
    selected?: boolean;
}
export declare function Button({ variant, selected, className, type, ...props }: ButtonProps): import("react").JSX.Element;
