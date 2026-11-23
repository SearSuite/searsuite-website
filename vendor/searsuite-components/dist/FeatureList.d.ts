export interface FeatureCardProps {
    title: string;
    description: string;
    href?: string;
}
export declare function FeatureCard({ title, description, href }: FeatureCardProps): import("react").JSX.Element;
export interface FeatureListProps {
    items: FeatureCardProps[];
}
export declare function FeatureList({ items }: FeatureListProps): import("react").JSX.Element;
