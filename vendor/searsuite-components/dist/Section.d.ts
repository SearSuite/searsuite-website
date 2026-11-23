import type { ReactNode } from 'react';
export interface SectionProps {
    id: string;
    title: string;
    children: ReactNode;
}
export declare function Section({ id, title, children }: SectionProps): import("react").JSX.Element;
