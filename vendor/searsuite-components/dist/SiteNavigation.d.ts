import type { NavLink } from './types.js';
export interface SiteNavigationProps {
    items: (NavLink & {
        current?: boolean;
    })[];
    label?: string;
}
export declare function SiteNavigation({ items, label }: SiteNavigationProps): import("react").JSX.Element;
