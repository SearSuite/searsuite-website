import type { NavGroup } from './types.js';
export interface SidebarGroupProps {
    group: NavGroup;
    currentHref?: string;
    onNavigate?: () => void;
}
export declare function SidebarGroup({ group, currentHref, onNavigate }: SidebarGroupProps): import("react").JSX.Element;
