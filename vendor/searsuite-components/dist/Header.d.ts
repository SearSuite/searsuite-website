import type { ReactNode } from 'react';
export interface HeaderProps {
    brand?: ReactNode;
    brandHref?: string;
    brandMark?: ReactNode;
    searchLabel?: string;
    onSearch?: () => void;
    onMenu?: () => void;
    menuExpanded?: boolean;
    navigation?: ReactNode;
}
export declare function Header({ brand, brandHref, brandMark, searchLabel, onSearch, onMenu, menuExpanded, navigation, }: HeaderProps): import("react").JSX.Element;
