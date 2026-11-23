import type { ReactNode } from 'react';
import type { NavLink } from './types.js';
export interface FooterProps {
    brand?: ReactNode;
    links?: NavLink[];
    extra?: ReactNode;
}
export declare function Footer({ brand, links, extra }: FooterProps): import("react").JSX.Element;
