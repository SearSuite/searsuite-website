import type { AnchorHTMLAttributes } from 'react';
export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    variant?: 'default' | 'brand' | 'source' | 'sidebar' | 'toc' | 'search';
}
export declare function Link({ variant, className, ...props }: LinkProps): import("react").JSX.Element;
