export interface BlogEntryProps {
    href: string;
    date: string;
    dateLabel: string;
    title: string;
    description: string;
}
export declare function BlogEntry({ href, date, dateLabel, title, description }: BlogEntryProps): import("react").JSX.Element;
export interface BlogListProps {
    items: BlogEntryProps[];
    label?: string;
}
export declare function BlogList({ items, label }: BlogListProps): import("react").JSX.Element;
