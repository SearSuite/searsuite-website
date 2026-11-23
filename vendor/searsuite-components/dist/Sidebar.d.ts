import type { NavGroup, NavLink } from './types.js';
export interface SidebarProps {
    title: string;
    groups?: NavGroup[];
    links?: NavLink[];
    currentHref?: string;
    ariaLabel?: string;
    open?: boolean;
    onClose?: () => void;
    onNavigate?: () => void;
}
export declare function Sidebar({ title, groups, links, currentHref, ariaLabel, open, onClose, onNavigate }: SidebarProps): import("react").JSX.Element;
