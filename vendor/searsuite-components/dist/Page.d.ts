import { type ReactNode } from 'react';
import { type ArticleProps } from './Article.js';
import type { NavGroup, NavLink } from './types.js';
export interface PageProps extends ArticleProps {
    brand?: ReactNode;
    brandHref?: string;
    brandMark?: ReactNode;
    breadcrumbs?: NavLink[];
    sidebarTitle: string;
    navigation: NavGroup[];
    searchLabel?: string;
    tocHeading?: string;
    footer?: ReactNode;
    footerLinks?: NavLink[];
}
export declare function Page({ brand, brandHref, brandMark, breadcrumbs, sidebarTitle, navigation, searchLabel, tocHeading, footer, footerLinks, title, intro, sections, markdown, sourceHref, feedback, }: PageProps): import("react").JSX.Element;
