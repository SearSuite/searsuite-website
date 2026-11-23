import type { ReactNode } from 'react';
export interface NavLink {
    label: string;
    href: string;
}
export interface NavGroup {
    label: string;
    links: NavLink[];
    defaultOpen?: boolean;
}
export interface DocSection {
    id: string;
    title: string;
    content: ReactNode;
    searchText?: string;
    inTableOfContents?: boolean;
    subsections?: {
        id: string;
        title: string;
    }[];
}
