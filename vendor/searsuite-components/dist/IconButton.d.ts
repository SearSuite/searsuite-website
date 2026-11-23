import type { ButtonHTMLAttributes } from 'react';
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    'aria-label': string;
}
export declare function IconButton({ className, type, ...props }: IconButtonProps): import("react").JSX.Element;
