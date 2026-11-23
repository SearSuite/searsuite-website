export interface DestinationLinkProps {
    href: string;
    index: string;
    title: string;
    description: string;
}
export declare function DestinationLink({ href, index, title, description }: DestinationLinkProps): import("react").JSX.Element;
export interface DestinationListProps {
    items: DestinationLinkProps[];
    label?: string;
}
export declare function DestinationList({ items, label }: DestinationListProps): import("react").JSX.Element;
