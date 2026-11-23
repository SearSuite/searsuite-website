import type { NavLink } from './types.js';
export interface NavItemProps {
    link: NavLink;
    onNavigate?: () => void;
    current?: boolean;
}
export declare function NavItem({ link, onNavigate, current }: NavItemProps): import("react").JSX.Element;
