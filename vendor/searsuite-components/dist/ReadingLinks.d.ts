import type { NavLink } from './types.js';
export interface ReadingLinksProps {
    items: NavLink[];
    label?: string;
}
export declare function ReadingLinks({ items, label }: ReadingLinksProps): import("react").JSX.Element;
