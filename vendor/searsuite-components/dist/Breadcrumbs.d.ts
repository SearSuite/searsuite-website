import type { NavLink } from './types.js';
export interface BreadcrumbsProps {
    items: NavLink[];
    current: string;
    onToggleSidebar?: () => void;
    sidebarCollapsed?: boolean;
}
export declare function Breadcrumbs({ items, current, onToggleSidebar, sidebarCollapsed }: BreadcrumbsProps): import("react").JSX.Element;
